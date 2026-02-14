"use client";

import { useEffect, useState, useCallback } from "react";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Search, RefreshCw, Calendar } from "lucide-react";
import type { Event42, User42 } from "@/lib/42api";

export default function DashboardPage() {
  const [allEvents, setAllEvents] = useState<Event42[]>([]); // Tous les événements du campus
  const [filteredEvents, setFilteredEvents] = useState<Event42[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [currentUser, setCurrentUser] = useState<User42 | null>(null);
  const perPage = 30;

  // Récupérer les événements à venir du campus
  const fetchAllEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Récupérer seulement les premiers événements (on va filtrer les événements à venir côté client)
      // Limiter à 200 événements pour éviter le rate limit
      const res = await fetch(`/api/events?campus_id=1&page=1&per_page=200`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to fetch events";

        // Gestion spéciale pour le rate limit
        if (errorMessage.includes("429") || errorMessage.includes("Rate Limit")) {
          setError("Trop de requêtes. Veuillez patienter quelques instants avant de réessayer.");
        } else {
          setError(errorMessage);
        }
        setAllEvents([]);
        setFilteredEvents([]);
        return;
      }
      const data = await res.json();

      // Vérifier si la réponse est un tableau
      if (!Array.isArray(data)) {
        console.error("API response is not an array:", data);
        setError("Format de réponse invalide de l'API");
        setAllEvents([]);
        setFilteredEvents([]);
        return;
      }

      setAllEvents(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des events";

      // Gestion spéciale pour le rate limit
      if (errorMessage.includes("429") || errorMessage.includes("Rate Limit")) {
        setError("Trop de requêtes. Veuillez patienter quelques instants avant de réessayer.");
      } else {
        setError(errorMessage);
      }
      console.error("Error fetching events:", err);
      setAllEvents([]);
      setFilteredEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllEvents();

    // Récupérer l'utilisateur actuel pour vérifier les permissions
    async function fetchCurrentUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const user: User42 = await res.json();
          setCurrentUser(user);
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    }
    fetchCurrentUser();
  }, [fetchAllEvents]);

  // Pagination et recherche
  useEffect(() => {
    let eventsToShow = allEvents;

    // Filtrer uniquement les événements à venir (begin_at dans le futur)
    const now = new Date();
    eventsToShow = allEvents.filter((event) => {
      const beginDate = new Date(event.begin_at);
      return beginDate > now;
    });

    // Trier par date de début (les plus proches en premier)
    eventsToShow.sort((a, b) => {
      const dateA = new Date(a.begin_at).getTime();
      const dateB = new Date(b.begin_at).getTime();
      return dateA - dateB;
    });

    // Appliquer la recherche si nécessaire
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      eventsToShow = eventsToShow.filter(
        (event) =>
          event.name.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query)
      );
    }

    // Appliquer la pagination
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedEvents = eventsToShow.slice(startIndex, endIndex);

    setFilteredEvents(paginatedEvents);
    setTotalPages(Math.ceil(eventsToShow.length / perPage));
  }, [allEvents, searchQuery, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Events Campus Paris
          </h1>
          <p className="text-muted-foreground mt-1">
            Liste de tous les events 42 à venir
          </p>
        </div>
        <Button variant="outline" onClick={fetchAllEvents} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un event..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary border-border"
        />
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">Aucun event trouve</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery ? "Essayez une autre recherche" : "Aucun event disponible pour le moment"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isAdmin={currentUser?.login === "mcherkao"}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Precedent
            </Button>
            <span className="px-4 py-2 text-sm text-muted-foreground">
              Page {page} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages || isLoading}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  RefreshCw,
  Download,
  ExternalLink
} from "lucide-react";
import type { Event42, EventUser, User42 } from "@/lib/42api";
import { format, parseISO, isPast, isFuture } from "date-fns";
import { fr } from "date-fns/locale";

function getEventStatus(beginAt: string, endAt: string) {
  const now = new Date();
  const begin = parseISO(beginAt);
  const end = parseISO(endAt);

  if (isPast(end)) {
    return { label: "Termine", variant: "secondary" as const };
  }
  if (isFuture(begin)) {
    return { label: "A venir", variant: "default" as const };
  }
  return { label: "En cours", variant: "destructive" as const };
}

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event42 | null>(null);
  const [eventUsers, setEventUsers] = useState<EventUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<EventUser[]>([]);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [currentUser, setCurrentUser] = useState<User42 | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const lastRequestTimeRef = useRef<number>(0);

  const checkAdminAccess = useCallback(async () => {
    setIsCheckingAdmin(true);
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const user: User42 = await res.json();
        setCurrentUser(user);

        // Vérifier si l'utilisateur est admin
        if (user.login !== "mcherkao") {
          setError("Accès refusé. Seuls les administrateurs peuvent voir la liste des participants.");
          setIsLoadingEvent(false);
          setIsLoadingUsers(false);
          return false;
        }
        return true;
      } else {
        setError("Erreur lors de la vérification des permissions.");
        setIsLoadingEvent(false);
        setIsLoadingUsers(false);
        return false;
      }
    } catch (err) {
      console.error("Error checking admin access:", err);
      setError("Erreur lors de la vérification des permissions.");
      setIsLoadingEvent(false);
      setIsLoadingUsers(false);
      return false;
    } finally {
      setIsCheckingAdmin(false);
    }
  }, []);

  const fetchEvent = useCallback(async () => {
    // Éviter les requêtes trop rapides (minimum 1 seconde entre les requêtes)
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    if (timeSinceLastRequest < 1000 && lastRequestTimeRef.current > 0) {
      const waitTime = 1000 - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    setIsLoadingEvent(true);
    setError(null);
    lastRequestTimeRef.current = Date.now();

    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to fetch event";

        // Gestion spéciale pour le rate limit
        if (res.status === 429 || errorMessage.includes("429") || errorMessage.includes("Rate Limit")) {
          setError("Trop de requêtes. Veuillez patienter quelques instants avant de réessayer.");
        } else {
          setError(`Erreur lors du chargement de l'événement: ${errorMessage}`);
        }
        return;
      }
      const data = await res.json();
      setEvent(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement de l'event";
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoadingEvent(false);
    }
  }, [eventId]);

  const fetchEventUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch(`/api/events/${eventId}/users?page=${page}&per_page=100`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to fetch event users";

        // Gestion spéciale pour le rate limit
        if (res.status === 429 || errorMessage.includes("429") || errorMessage.includes("Rate Limit")) {
          console.warn("Rate limit reached while fetching event users");
          // Ne pas afficher d'erreur pour les utilisateurs, juste logger
        } else {
          console.error("Error fetching event users:", errorMessage);
        }
        return;
      }
      const data = await res.json();

      // Vérifier que c'est un tableau
      if (Array.isArray(data)) {
        setEventUsers((prev) => (page === 1 ? data : [...prev, ...data]));
      }
    } catch (err) {
      console.error("Error fetching event users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [eventId, page]);

  useEffect(() => {
    async function init() {
      const isAdmin = await checkAdminAccess();
      if (isAdmin) {
        fetchEvent();
      }
    }
    init();
  }, [checkAdminAccess, fetchEvent]);

  useEffect(() => {
    if (currentUser && currentUser.login === "mcherkao") {
      fetchEventUsers();
    }
  }, [fetchEventUsers, currentUser]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(eventUsers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        eventUsers.filter(
          (eu) =>
            eu.user.login.toLowerCase().includes(query) ||
            eu.user.displayname?.toLowerCase().includes(query) ||
            eu.user.first_name?.toLowerCase().includes(query) ||
            eu.user.last_name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, eventUsers]);

  const exportCSV = () => {
    const headers = ["Login", "Nom", "Prenom", "Email"];
    const rows = eventUsers.map((eu) => [
      eu.user.login,
      eu.user.last_name,
      eu.user.first_name,
      eu.user.email,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell || ""}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `participants-${event?.name || eventId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isRateLimit = error.includes("429") || error.includes("Rate Limit") || error.includes("Trop de requêtes");
    const isAccessDenied = error.includes("Accès refusé");

    return (
      <div className="space-y-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux events
          </Button>
        </Link>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              {isAccessDenied ? "Accès refusé" : isRateLimit ? "Limite de requêtes atteinte" : "Erreur"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-destructive">{error}</p>
            {isRateLimit && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>L'API 42 limite le nombre de requêtes par minute pour éviter la surcharge.</p>
                <p>Veuillez attendre 1-2 minutes avant de réessayer.</p>
              </div>
            )}
            {isAccessDenied && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Cette page est réservée aux administrateurs.</p>
                <p>Seul l'administrateur peut voir la liste des participants.</p>
              </div>
            )}
            {!isAccessDenied && (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setError(null);
                    fetchEvent();
                  }}
                  disabled={isLoadingEvent}
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingEvent ? "animate-spin" : ""}`} />
                  Réessayer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour aux events
        </Button>
      </Link>

      {isLoadingEvent ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : event ? (
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getEventStatus(event.begin_at, event.end_at).variant}>
                    {getEventStatus(event.begin_at, event.end_at).label}
                  </Badge>
                  <Badge variant="outline">{event.kind}</Badge>
                </div>
                <CardTitle className="text-2xl text-card-foreground">
                  {event.name}
                </CardTitle>
                {event.description && (
                  <CardDescription
                    className="max-w-3xl"
                    dangerouslySetInnerHTML={{ __html: event.description }}
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{format(parseISO(event.begin_at), "d MMMM yyyy", { locale: fr })}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>
                  {format(parseISO(event.begin_at), "HH:mm")} - {format(parseISO(event.end_at), "HH:mm")}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{event.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 text-primary" />
                <span>
                  {event.nbr_subscribers}
                  {event.max_people && ` / ${event.max_people}`} inscrits
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Participants ({eventUsers.length})
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              disabled={eventUsers.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPage(1);
                fetchEventUsers();
              }}
              disabled={isLoadingUsers}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUsers ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un participant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>

        {isLoadingUsers && eventUsers.length === 0 ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">Aucun participant</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery ? "Essayez une autre recherche" : "Personne n'est inscrit a cet event"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((eu) => (
                <Card key={eu.id} className="border-border bg-card hover:bg-secondary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={eu.user.image?.versions?.small || eu.user.image?.link || undefined}
                          alt={eu.user.displayname}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {eu.user.login.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-card-foreground truncate">
                          {eu.user.displayname || eu.user.login}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          @{eu.user.login}
                        </p>
                      </div>
                      <a
                        href={`https://profile.intra.42.fr/users/${eu.user.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {!isLoadingUsers && eventUsers.length >= page * 100 && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isLoadingUsers}
                >
                  Charger plus de participants
                </Button>
              </div>
            )}

            {isLoadingUsers && eventUsers.length > 0 && (
              <div className="flex justify-center pt-4">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

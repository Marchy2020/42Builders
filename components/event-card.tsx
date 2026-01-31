"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, ChevronRight } from "lucide-react";
import type { Event42 } from "@/lib/42api";
import { format, parseISO, isPast, isFuture } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface EventCardProps {
  event: Event42;
}

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

function getKindLabel(kind: string) {
  const kinds: Record<string, string> = {
    "event": "Event",
    "workshop": "Workshop",
    "conference": "Conference",
    "hackathon": "Hackathon",
    "meet_up": "Meet-up",
    "association": "Association",
    "extern": "Externe",
    "partnership": "Partenariat",
  };
  return kinds[kind] || kind;
}

export function EventCard({ event }: EventCardProps) {
  const status = getEventStatus(event.begin_at, event.end_at);
  const beginDate = parseISO(event.begin_at);
  const endDate = parseISO(event.end_at);

  return (
    <Card className="border-border bg-card hover:bg-secondary/50 transition-colors group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={status.variant} className="text-xs">
                {status.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getKindLabel(event.kind)}
              </Badge>
            </div>
            <CardTitle className="text-lg text-card-foreground line-clamp-2">
              {event.name}
            </CardTitle>
          </div>
        </div>
        {event.description && (
          <CardDescription className="line-clamp-2 mt-2">
            {event.description.replace(/<[^>]*>/g, "")}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{format(beginDate, "d MMM yyyy", { locale: fr })}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              {format(beginDate, "HH:mm")} - {format(endDate, "HH:mm")}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="truncate">{event.location}</span>
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

        <Link href={`/dashboard/events/${event.id}`}>
          <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            Voir les participants
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

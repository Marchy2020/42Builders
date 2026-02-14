const API_BASE = "https://api.intra.42.fr";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  created_at: number;
}

export interface Event42 {
  id: number;
  name: string;
  description: string;
  location: string;
  kind: string;
  max_people: number | null;
  nbr_subscribers: number;
  begin_at: string;
  end_at: string;
  campus_ids: number[];
  cursus_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface User42 {
  id: number;
  email: string;
  login: string;
  first_name: string;
  last_name: string;
  usual_full_name: string | null;
  usual_first_name: string | null;
  url: string;
  phone: string;
  displayname: string;
  kind: string;
  image: {
    link: string | null;
    versions: {
      large: string | null;
      medium: string | null;
      small: string | null;
      micro: string | null;
    };
  };
  staff?: boolean;
  correction_point: number;
  pool_month: string | null;
  pool_year: string | null;
  location: string | null;
  wallet: number;
  anonymize_date: string;
  data_erasure_date: string | null;
  created_at: string;
  updated_at: string;
  alumnized_at: string | null;
  alumni?: boolean;
  active?: boolean;
}

export interface EventUser {
  id: number;
  event_id: number;
  user_id: number;
  user: User42;
}

export function getAuthorizationUrl(): string {
  const clientId = process.env.FORTYTWO_CLIENT_ID;
  const redirectUri = process.env.FORTYTWO_REDIRECT_URI || "http://localhost:3000/api/auth/callback";

  const params = new URLSearchParams({
    client_id: clientId || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "public",
  });

  return `${API_BASE}/oauth/authorize?${params.toString()}`;
}

export async function getAccessToken(code: string): Promise<TokenResponse> {
  const clientId = process.env.FORTYTWO_CLIENT_ID;
  const clientSecret = process.env.FORTYTWO_CLIENT_SECRET;
  const redirectUri = process.env.FORTYTWO_REDIRECT_URI || "http://localhost:3000/api/auth/callback";

  const response = await fetch(`${API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId || "",
      client_secret: clientSecret || "",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  return response.json();
}

export async function getClientCredentialsToken(): Promise<TokenResponse> {
  const clientId = process.env.FORTYTWO_CLIENT_ID;
  const clientSecret = process.env.FORTYTWO_CLIENT_SECRET;

  const response = await fetch(`${API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId || "",
      client_secret: clientSecret || "",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get client credentials token: ${error}`);
  }

  return response.json();
}

export async function fetchCampusEvents(
  accessToken: string,
  campusId: number = 1,
  page: number = 1,
  perPage: number = 30
): Promise<Event42[]> {
  // Si perPage est grand (>= 200), utiliser la fonction spéciale mais avec limite
  if (perPage >= 200) {
    return fetchAllCampusEvents(accessToken, campusId);
  }

  // Sinon, utiliser la pagination normale
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: Math.min(perPage * 3, 100).toString(), // Limiter à 100 max pour éviter le rate limit
    "sort": "-begin_at",
  });

  const response = await fetch(
    `${API_BASE}/v2/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to fetch campus events: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // S'assurer que la réponse est un tableau
  if (!Array.isArray(data)) {
    console.error("42 API returned non-array response:", data);
    throw new Error("Invalid response format: expected array");
  }

  // Filtrer par campus_id (car campus_ids est un tableau dans Event42)
  const filteredEvents = data.filter((event: Event42) =>
    event.campus_ids && event.campus_ids.includes(campusId)
  );

  // Retourner le nombre demandé d'événements
  return filteredEvents.slice(0, perPage);
}

// Fonction pour récupérer TOUS les événements d'un campus
export async function fetchAllCampusEvents(
  accessToken: string,
  campusId: number = 1
): Promise<Event42[]> {
  const allCampusEvents: Event42[] = [];
  let currentPage = 1;
  const pageSize = 100; // Récupérer 100 événements par page
  let hasMore = true;
  const maxPages = 10; // Limiter à 10 pages pour éviter le rate limit (1000 événements max)

  while (hasMore && currentPage <= maxPages) {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      per_page: pageSize.toString(),
      "sort": "-begin_at",
    });

    const response = await fetch(
      `${API_BASE}/v2/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      // Si on a un rate limit, arrêter immédiatement
      if (response.status === 429) {
        console.warn("Rate limit reached, stopping pagination");
        break;
      }

      const errorText = await response.text();
      let errorMessage = `Failed to fetch campus events: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // S'assurer que la réponse est un tableau
    if (!Array.isArray(data)) {
      console.error("42 API returned non-array response:", data);
      throw new Error("Invalid response format: expected array");
    }

    // Si aucune donnée n'est retournée, on a fini
    if (data.length === 0) {
      hasMore = false;
      break;
    }

    // Filtrer par campus_id et ajouter aux résultats
    const filteredEvents = data.filter((event: Event42) =>
      event.campus_ids && event.campus_ids.includes(campusId)
    );

    allCampusEvents.push(...filteredEvents);

    // Si on a récupéré moins que pageSize, c'est la dernière page
    if (data.length < pageSize) {
      hasMore = false;
    } else {
      currentPage++;
      // Ajouter un petit délai entre les requêtes pour éviter le rate limit
      if (currentPage <= maxPages) {
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms de délai
      }
    }
  }

  return allCampusEvents;
}

export async function fetchCurrentUser(accessToken: string): Promise<User42> {
  const response = await fetch(`${API_BASE}/v2/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to fetch current user: ${response.status} ${response.statusText}`;

    // Gestion spéciale pour le rate limit
    if (response.status === 429) {
      errorMessage = "429 Too Many Requests (Spam Rate Limit Exceeded)";
    } else {
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

export async function fetchEvent(
  accessToken: string,
  eventId: number
): Promise<Event42> {
  const response = await fetch(`${API_BASE}/v2/events/${eventId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to fetch event: ${response.status} ${response.statusText}`;

    // Gestion spéciale pour le rate limit
    if (response.status === 429) {
      errorMessage = "429 Too Many Requests (Spam Rate Limit Exceeded)";
    } else {
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

export async function fetchEventUsers(
  accessToken: string,
  eventId: number,
  page: number = 1,
  perPage: number = 100
): Promise<EventUser[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  const response = await fetch(
    `${API_BASE}/v2/events/${eventId}/events_users?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to fetch event users: ${response.status} ${response.statusText}`;

    // Gestion spéciale pour le rate limit
    if (response.status === 429) {
      errorMessage = "429 Too Many Requests (Spam Rate Limit Exceeded)";
    } else {
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();

  // S'assurer que la réponse est un tableau
  if (!Array.isArray(data)) {
    console.error("42 API returned non-array response for event users:", data);
    throw new Error("Invalid response format: expected array");
  }

  return data;
}

export async function fetchAllEvents(
  accessToken: string,
  page: number = 1,
  perPage: number = 30
): Promise<Event42[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    "sort": "-begin_at",
  });

  const response = await fetch(
    `${API_BASE}/v2/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch all events: ${error}`);
  }

  return response.json();
}

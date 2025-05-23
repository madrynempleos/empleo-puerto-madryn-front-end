import { Oferta } from "../types/iOferta";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;


export async function fetchOfertaById(id: string): Promise<Oferta> {
  try {
    const response = await fetch(`${apiUrl}/api/ofertas/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (typeof data !== "object" || data === null) {
      throw new Error("La respuesta del servidor no es un objeto válido");
    }

    return data as Oferta;
  } catch (error) {

    throw error instanceof Error 
      ? error 
      : new Error(`Error desconocido al obtener oferta con ID ${id}`);
  }
}


export async function fetchOfertaBySlug(slug: string): Promise<Oferta> {
  try {
    const response = await fetch(`${apiUrl}/api/ofertas/detalles/${slug}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (typeof data !== "object" || data === null) {
      throw new Error("La respuesta del servidor no es un objeto válido");
    }

    return data as Oferta;
  } catch (error) {

    throw error instanceof Error 
      ? error 
      : new Error(`Error desconocido al obtener oferta con slug ${slug}`);
  }
}


export async function fetchOfertas(): Promise<Oferta[]> {
  try {
    const response = await fetch(`${apiUrl}/api/ofertas`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("La respuesta del servidor no es un array válido");
    }
    return data as Oferta[];
  } catch (error) {

    throw error instanceof Error 
      ? error 
      : new Error("Error desconocido al obtener ofertas");
  }
}


export async function fetchUserOfertas(token: string): Promise<Oferta[]> {
  try {
    const response = await fetch(`${apiUrl}/api/ofertas/mis-avisos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("La respuesta del servidor no es un array válido");
    }

    return data as Oferta[];
  } catch (error) {

    throw error instanceof Error 
      ? error 
      : new Error("Error desconocido al obtener ofertas del usuario");
  }
}


export async function updateOferta(
  data: {
    id: string;
    titulo: string;
    descripcion: string;
    usuarioId: string;
    empresaConsultora: string;
    fechaCierre: Date | null;
    formaPostulacion: string;
    emailContacto: string | null;
    linkPostulacion: string | null;
    categoriaId: string;
    logo?: File | null;
    logoUrl?: string | null;
    habilitado: boolean;
  },
  token: string
): Promise<Oferta> {
  try {
    const formData = new FormData();

    const ofertaData = {
      id: data.id,
      titulo: data.titulo,
      descripcion: data.descripcion,
      usuario: { id: data.usuarioId },
      empresaConsultora: data.empresaConsultora,
      fechaPublicacion: new Date().toISOString(),
      fechaCierre: data.fechaCierre ? new Date(data.fechaCierre).toISOString() : null,
      formaPostulacion: data.formaPostulacion as "MAIL" | "LINK",
      emailContacto: data.formaPostulacion === "MAIL" ? data.emailContacto : null,
      linkPostulacion: data.formaPostulacion === "LINK" ? data.linkPostulacion : null,
      categoria: { id: data.categoriaId },
      habilitado: data.habilitado,
    };

    formData.append("oferta", JSON.stringify(ofertaData));

    if (data.logo) {
      formData.append("logo", data.logo);
    }

    formData.append("logoUrl", data.logoUrl ?? "null");

    const response = await fetch(`${apiUrl}/api/ofertas/${data.id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const dataResponse = await response.json();
    return dataResponse as Oferta;
  } catch (error) {

    throw error instanceof Error 
      ? error 
      : new Error(`Error desconocido al actualizar oferta con ID ${data.id}`);
  }
}


export async function createOferta(
  data: {
    titulo: string;
    descripcion: string;
    usuarioId: string;
    empresaConsultora: string;
    fechaCierre: string | null;
    formaPostulacion: string;
    emailContacto: string | null;
    linkPostulacion: string | null;
    categoriaId: string;
    logo?: File | null;
  },
  token: string
): Promise<Oferta> {
  try {
    const formData = new FormData();

    const ofertaData = {
      titulo: data.titulo,
      descripcion: data.descripcion,
      usuario: { id: data.usuarioId },
      empresaConsultora: data.empresaConsultora,
      fechaPublicacion: new Date().toISOString(),
      fechaCierre: data.fechaCierre,
      formaPostulacion: data.formaPostulacion as "MAIL" | "LINK",
      emailContacto: data.formaPostulacion === "MAIL" ? data.emailContacto : null,
      linkPostulacion: data.formaPostulacion === "LINK" ? data.linkPostulacion : null,
      categoria: { id: data.categoriaId },
    };

    formData.append("oferta", JSON.stringify(ofertaData));

    if (data.logo) {
      formData.append("logo", data.logo);
    }

    const response = await fetch(`${apiUrl}/api/ofertas`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const dataResponse = await response.json();
    return dataResponse as Oferta;
  } catch (error) {

    throw error instanceof Error 
      ? error 
      : new Error("Error desconocido al crear oferta");
  }
}


export async function deleteOferta(id: string, token: string): Promise<void> {
  try {
    const response = await fetch(`${apiUrl}/api/ofertas/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {

      if (response.status === 404) {
        return;
      }
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
  } catch (error) {

    throw error instanceof Error 
      ? error 
      : new Error(`Error desconocido al eliminar oferta con ID ${id}`);
  }
}


export async function enableOfertaAdmin(id: string, token: string): Promise<void> {
  const url = `${apiUrl}/api/admin/ofertas/habilitar/${id}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
  } catch (error) {

    throw error instanceof Error 
      ? error 
      : new Error(`Error desconocido al habilitar oferta con ID ${id}`);
  }
}


export async function deleteOfertaAdmin(id: string, token: string): Promise<void> {
  const url = `${apiUrl}/api/admin/ofertas/${id}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
  } catch (error) {

    throw error instanceof Error 
      ? error 
      : new Error(`Error desconocido al eliminar oferta con ID ${id} como administrador`);
  }
}
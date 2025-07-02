"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Oferta } from "@/lib/types/iOferta";
import { MapPin, Calendar, Edit, Trash2, ArrowRight, Building } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { useState } from "react";

interface OfertaCardProps {
  oferta: Oferta;
  showEditOptions?: boolean;
  onEdit?: (ofertaId: string) => void;
  onDelete?: (ofertaId: string) => void;
}

const DEFAULT_LOGO_URL = "https://example.com/default-logo.png";

const getLogoUrl = (logoUrl: string | null | undefined): string | null => {
  if (!logoUrl || logoUrl === DEFAULT_LOGO_URL) {
    return null;
  }

  const isExternalUrl = logoUrl.startsWith("http://") || logoUrl.startsWith("https://");
  return isExternalUrl ? logoUrl : `${process.env.NEXT_PUBLIC_API_URL}${logoUrl}`;
};

export function OfertaCard({ oferta: oferta, showEditOptions = false, onEdit, onDelete }: OfertaCardProps) {
  const [logoError, setLogoError] = useState(false); // Estado para manejar errores de carga del logo

  const calculateDaysAgo = (date: string) => {
    const publicationDate = new Date(date);
    const currentDate = new Date();
    const differenceInTime = currentDate.getTime() - publicationDate.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
    if (differenceInDays <= 0) return "Hoy";
    if (differenceInDays === 1) return "Hace 1 día";
    if (differenceInDays > 1) return `Hace ${differenceInDays} días`;
    console.log(oferta.slug);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onEdit) onEdit(oferta.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onDelete) onDelete(oferta.id);
  };

  return (
    <Link href={`/detalles-empleo/${oferta.slug}`} passHref>
      <Card
        className={cn(
          "group relative flex flex-col overflow-hidden transition-all duration-300",
          "hover:shadow-xl hover:-translate-y-2 hover:bg-primary/5 border-secondary/30",
          "bg-gradient-to-b from-white to-secondary/10 min-w-[280px]"
        )}
      >
        <CardHeader className="pb-2 pt-5">
          <div className="flex justify-between items-center gap-2 mb-1">
            {logoError || !getLogoUrl(oferta.logoUrl) ? (
              <div className="rounded-full h-12 w-12 flex items-center justify-center bg-primary/10">
                <Building className="h-6 w-6 text-primary" />
              </div>
            ) : (
              <Image
                src={getLogoUrl(oferta.logoUrl) as string}
                alt={oferta.empresaConsultora || "Logo de la empresa"}
                width={60}
                height={60}
                className="rounded-full h-12 w-12 object-cover"
                onError={() => setLogoError(true)} 
              />
            )}
            <Badge
              className="bg-primary text-white border-primary font-semibold px-3 py-1 rounded-md line-clamp-1"
            >
              {oferta.categoria.nombre}
            </Badge>
          </div>
          <CardTitle className="line-clamp-1 mt-3 uppercase font-bold group-hover:text-primary transition-colors">
            {oferta.titulo}
          </CardTitle>
          <p className="text-muted-foreground font-medium uppercase text-sm">{oferta.empresaConsultora}</p>
          <Separator className="border border-accent" />
        </CardHeader>

        <CardContent className="space-y-4 flex-grow pb-6 mt-2">
          <div className="flex justify-between gap-4 text-sm">
            <div className="flex items-center gap-1.5 bg-secondary/30 py-1 px-2 rounded-full">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="text-neutral-800 font-medium line-clamp-1">Puerto Madryn</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center">
          <div className="w-full flex justify-center items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              className="flex bg-ocean-gradient w-full text-white font-semibold py-2 px-6 rounded-md transition-all duration-300 hover:shadow-lg hover:scale-105 transform"
            >
              <ArrowRight className="h-4 w-4" />
              Ver detalles
            </Button>
          </div>
        </CardFooter>

        {showEditOptions && (
          <div className="flex justify-between items-center gap-2 px-4 pb-2">
            <Button
              variant="outline"
              size="lg"
              onClick={handleEditClick}
              className="flex hover:bg-primary/90 hover:text-white items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleDeleteClick}
              className="flex items-center gap-2 text-destructive border-destructive/30 hover:bg-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        )}
      </Card>
    </Link>
  );
}

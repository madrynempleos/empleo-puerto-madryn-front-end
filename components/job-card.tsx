import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { JobPosting } from "@/lib/types"
import { Briefcase, Heart, MapPin, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface JobCardProps {
  job: JobPosting
  onToggleFavorite?: () => void
  isFavorite?: boolean
  showEditOptions?: boolean
}

export function JobCard({ job, onToggleFavorite, isFavorite = false, showEditOptions = false }: JobCardProps) {
  const formattedDate = new Date(job.fechaPublicacion).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Favorite button - now always visible but more prominent on hover */}
      <div className="absolute top-3 right-3 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/80 backdrop-blur-sm transition-transform group-hover:scale-110"
                onClick={onToggleFavorite}
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-all",
                    isFavorite ? "fill-primary stroke-primary" : "group-hover:stroke-primary",
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <CardHeader className="pb-2 pt-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-primary/10 p-2 rounded-full">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            {job.categoria.nombre}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2 mt-3 group-hover:text-primary transition-colors">{job.titulo}</CardTitle>
        <p className="text-muted-foreground font-medium">{job.empresaConsultora}</p>
      </CardHeader>

      <CardContent className="space-y-4 flex-grow pb-6">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5 bg-secondary/30 px-2.5 py-1 rounded-full">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Puerto Madryn</span>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/30 px-2.5 py-1 rounded-full">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{formattedDate}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground line-clamp-3">{job.descripcion}</p>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button asChild className="w-full group/button transition-all" variant="default">
          <Link href={`/empleos/${job.id}`} className="flex items-center justify-center">
            <span>Ver detalles</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}


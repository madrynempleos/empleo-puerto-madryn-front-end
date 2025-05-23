"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCategorias } from "@/lib/hooks/useCategorias";
import { useOfertaById } from "@/lib/hooks/useOfertas";
import { updateOferta } from "@/lib/api/ofertas";
import { Loader2, Ship, X, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import RteEditor from "@/components/ui/RteEditor";
import { Oferta } from "@/lib/types/iOferta";
import { Categoria } from "@/lib/types/iCategoria";
import { Session } from "next-auth";
import VolverButton from "@/components/ui/volver";
import Loader from "@/components/ui/loader";
import Error from "@/components/ui/error";

const formSchema = z
  .object({
    titulo: z
      .string()
      .min(1, "El título es obligatorio")
      .max(150, "El título no puede superar los 150 caracteres")
      .trim()
      .refine((val) => val.length > 0 && val.trim().length > 0, {
        message: "El título no puede ser solo espacios",
      })
      .refine((val) => !/[^a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ./]/.test(val), {
        message: "El título no puede contener caracteres especiales raros",
      }),
    descripcion: z
      .string()
      .min(1, "La descripción es obligatoria")
      .max(5000, "La descripción no puede superar los 5000 caracteres")
      .trim()
      .refine((val) => val.length > 0 && val.trim().length > 0, {
        message: "La descripción no puede ser solo espacios",
      }),
    empresaConsultora: z
      .string()
      .min(1, "El nombre de la empresa es obligatorio")
      .max(150, "El nombre de la empresa no puede superar los 150 caracteres")
      .trim()
      .refine((val) => val.length > 0 && val.trim().length > 0, {
        message: "La empresa no puede ser solo espacios",
      })
      .refine((val) => !/[^a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ.,-]/.test(val), {
        message: "La empresa no puede contener caracteres especiales raros",
      }),
    categoria: z.string().min(1, "Debes seleccionar una categoría"),
    formaPostulacion: z.enum(["MAIL", "LINK"], {
      required_error: "Debes seleccionar una forma de postulación",
    }),
    emailContacto: z
      .string()
      .email("Debes ingresar un email válido")
      .optional()
      .nullable(),
    linkPostulacion: z
      .string()
      .url("Debes ingresar una URL válida (ej: https://example.com)")
      .trim()
      .refine((val) => !val || (val.length > 0 && val.trim().length > 0), {
        message: "El link no puede ser solo espacios",
      })
      .optional()
      .nullable(),
    fechaCierre: z.string().optional().nullable(),
    logo: z
      .instanceof(File)
      .optional()
      .refine((file) => !file || file.size <= 5 * 1024 * 1024, {
        message: "El archivo no puede superar los 5MB",
      })
      .refine((file) => !file || ["image/png", "image/jpeg", "image/jpg"].includes(file.type), {
        message: "Solo se permiten imágenes en formato PNG, JPEG o JPG",
      }),
  })
  .refine(
    (data) => {
      if (data.formaPostulacion === "MAIL" && (!data.emailContacto || data.emailContacto.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "Debes ingresar un email válido para postulación por email",
      path: ["emailContacto"],
    }
  )
  .refine(
    (data) => {
      if (data.formaPostulacion === "LINK" && (!data.linkPostulacion || data.linkPostulacion.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "Debes ingresar una URL válida para postulación por enlace",
      path: ["linkPostulacion"],
    }
  )
  .refine(
    (data) => {
      if (data.fechaCierre && new Date(data.fechaCierre) < new Date()) {
        return false;
      }
      return true;
    },
    {
      message: "La fecha de cierre no puede ser anterior a hoy",
      path: ["fechaCierre"],
    }
  );

type FormData = z.infer<typeof formSchema>;

export default function EditarAvisoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const { data: oferta, isLoading: ofertaLoading, error: ofertaError } = useOfertaById(id as string);
  const { data: categorias, isLoading: categoriasLoading, error: categoriasError } = useCategorias();

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (status === "loading" || ofertaLoading || categoriasLoading) {return <Loader />;}

  if (ofertaError || categoriasError || !oferta) {return <Error error={ofertaError || categoriasError} message={!oferta ? "No se pudo cargar la oferta" : undefined} />;
  }

  if (!categorias || categorias.length === 0) {
    return <div className="text-center py-8">No hay categorías disponibles.</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <EditForm
        oferta={oferta}
        categorias={categorias}
        session={session}
        id={id as string}
        router={router}
      />
    </div>
  );
}

interface EditFormProps {
  oferta: Oferta;
  categorias: Categoria[];
  session: Session | null;
  id: string;
  router: ReturnType<typeof useRouter>;
}

function EditForm({ oferta: oferta, categorias, session, id, router }: EditFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(oferta.logoUrl || null);
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: oferta.titulo || "",
      descripcion: oferta.descripcion || "",
      empresaConsultora: oferta.empresaConsultora || "",
      categoria: oferta.categoria?.id || "",
      formaPostulacion: (oferta.formaPostulacion as "MAIL" | "LINK") || "MAIL",
      emailContacto: oferta.formaPostulacion === "MAIL" ? oferta.contactoPostulacion || null : null,
      linkPostulacion: oferta.formaPostulacion === "LINK" ? oferta.contactoPostulacion || null : null,
      fechaCierre: oferta.fechaCierre ? new Date(oferta.fechaCierre).toISOString().split("T")[0] : null,
      logo: undefined,
    },
  });

  type UpdateOfertaData = {
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
  };

  const updateOfertaMutation = useMutation({
    mutationFn: ({ data, token }: { data: UpdateOfertaData; token: string }) => updateOferta(data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobPost", id] });
      queryClient.invalidateQueries({ queryKey: ["userJobPosts"] });
      setSubmitSuccess("¡Oferta actualizada con éxito!");
      setTimeout(() => router.push("/mis-avisos"), 5000);
    },
    onError: (err) => {
      console.error("Error en la mutación:", err);
      setSubmitError(err instanceof Error ? err.message : "Error desconocido al actualizar la oferta");
    },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsSubmitting(true);
    try {
      const updateData: UpdateOfertaData = {
        id: id,
        titulo: data.titulo,
        descripcion: data.descripcion,
        usuarioId: session?.user.id || "",
        empresaConsultora: data.empresaConsultora,
        fechaCierre: data.fechaCierre ? new Date(data.fechaCierre) : null,
        formaPostulacion: data.formaPostulacion,
        emailContacto: data.formaPostulacion === "MAIL" ? (data.emailContacto || null) : null,
        linkPostulacion: data.formaPostulacion === "LINK" ? (data.linkPostulacion || null) : null,
        categoriaId: data.categoria,
        logo: data.logo ?? null,
        logoUrl: existingLogoUrl,
        habilitado: oferta.habilitado,
      };

      await updateOfertaMutation.mutateAsync({
        data: updateData,
        token: session?.backendToken || "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setSubmitSuccess(null);
    router.push("/mis-avisos");
  };

  return (
    <>
      <VolverButton />
      <header className="mb-8 space-y-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-center text-primary uppercase">Editar Aviso</h1>
        <p className="text-center text-muted-foreground">
          Modifica tu oferta laboral en Puerto Madryn con Madryn Empleos.
        </p>
        <p className="text-center text-muted-foreground">
        Actualiza el título, descripción, categoría, forma de postulación u otros detalles.
        </p>
      </header>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-2xl mx-auto space-y-6 bg-gradient-to-b from-white to-secondary/10 p-6 rounded-lg border border-secondary/30 shadow-sm"
        >
          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary font-medium">Título del empleo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ej: Full Stack Developer Junior"
                    {...field}
                    className="border-primary/20 focus-visible:ring-primary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="logo"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel className="text-primary font-medium">Logo de la empresa (opcional)</FormLabel>
                {existingLogoUrl && !value && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      Logo actual: {existingLogoUrl.split("_").pop()}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setExistingLogoUrl(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <FormControl>
                  <Input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      onChange(file);
                    }}
                    className="border-primary/20 focus-visible:ring-primary"
                    {...field}
                  />
                </FormControl>
                {value && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{value.name}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive hover:bg-destructive"
                      onClick={() => {
                        onChange(undefined);
                        const input = document.querySelector('input[name="logo"]') as HTMLInputElement;
                        if (input) input.value = "";
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary font-medium">Descripción</FormLabel>
                <FormControl>
                  <RteEditor content={field.value} onChange={(val) => field.onChange(val)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="empresaConsultora"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary font-medium">Empresa</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ej: Globant"
                    {...field}
                    className="border-primary/20 focus-visible:ring-primary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary font-medium">Categoría</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                  <FormControl>
                    <SelectTrigger className="border-primary/20 focus:ring-primary">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="formaPostulacion"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-primary font-medium">Forma de postulación</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === "MAIL") {
                        form.setValue("linkPostulacion", null);
                      } else {
                        form.setValue("emailContacto", null);
                      }
                    }}
                    value={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="MAIL" />
                      </FormControl>
                      <FormLabel className="font-normal">Email</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="LINK" />
                      </FormControl>
                      <FormLabel className="font-normal">Link externo</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.watch("formaPostulacion") === "MAIL" && (
            <FormField
              control={form.control}
              name="emailContacto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium">Email de contacto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="contacto@empresa.com"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      className="border-primary/20 focus-visible:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {form.watch("formaPostulacion") === "LINK" && (
            <FormField
              control={form.control}
              name="linkPostulacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-primary font-medium">Link de postulación</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      className="border-primary/20 focus-visible:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="fechaCierre"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary font-medium">Fecha de cierre (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    className="border-primary/20 focus-visible:ring-primary"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Ship className="mr-2 h-4 w-4" />
                Guardar cambios
              </>
            )}
          </Button>
        </form>
      </Form>

      {submitSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <Alert
            variant="default"
            className="bg-green-50 border-green-400 text-green-800 shadow-lg max-w-md w-full mx-4 p-6 text-center rounded-lg"
          >
            <CheckCircle2 className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">¡Éxito!</AlertTitle>
            <AlertDescription className="mt-1">
              {submitSuccess}
            </AlertDescription>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={handleCloseSuccess}
            >
              Cerrar
            </Button>
          </Alert>
        </div>
      )}
    </>
  );
}
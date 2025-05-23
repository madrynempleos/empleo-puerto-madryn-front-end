"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCategorias } from "@/lib/hooks/useCategorias";
import { createOferta } from "@/lib/api/ofertas";
import { Loader2, Anchor, X, CheckCircle2 } from "lucide-react";
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import RteEditor from "@/components/ui/RteEditor";
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
        message: "El título no puede contener caracteres especiales raros (excepto /)",
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
      .refine((val) => !/[^a-zA-Z0-9\sáéíóúÁÉÍÓÚ./]/.test(val), {
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

export default function PublicarEmpleoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: categorias, isLoading: categoriasLoading, error: categoriasError } = useCategorias();
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  type CreateJobOfferData = {
    titulo: string;
    descripcion: string;
    usuarioId: string;
    empresaConsultora: string;
    fechaCierre: string | null;
    formaPostulacion: string;
    emailContacto: string | null;
    linkPostulacion: string | null;
    categoriaId: string;
    logo: File | null;
  };

  const createJobOfferMutation = useMutation({
    mutationFn: ({ data, token }: { data: CreateJobOfferData; token: string }) => createOferta(data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobPosts"] });
      setSubmitSuccess(
        "¡Oferta enviada con éxito! Será publicada en la web tras ser verificada por nuestro equipo. Luego de eso, recibirás un email de confirmación."
      );
      form.reset();
      setTimeout(() => router.push("/"), 5000);
    }
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      empresaConsultora: "",
      categoria: "",
      formaPostulacion: "MAIL",
      emailContacto: null,
      linkPostulacion: null,
      fechaCierre: null,
      logo: undefined,
    },
  });

  useAuthCheck();

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (categoriasLoading) { return <Loader />; }

  if (categoriasError) { return <Error error={categoriasError instanceof Error ? categoriasError : null} />; }

  if (!categorias || categorias.length === 0) {
    return <div className="text-center py-8">No hay categorías disponibles.</div>;
  }

  const onSubmit = async (data: FormData) => {
    setSubmitSuccess(null);
    setIsSubmitting(true);
    try {
      const createData: CreateJobOfferData = {
        titulo: data.titulo,
        descripcion: data.descripcion,
        usuarioId: session?.user?.id || "",
        empresaConsultora: data.empresaConsultora,
        fechaCierre: data.fechaCierre ? new Date(data.fechaCierre).toISOString() : null,
        formaPostulacion: data.formaPostulacion,
        emailContacto: data.formaPostulacion === "MAIL" ? data.emailContacto ?? null : null,
        linkPostulacion: data.formaPostulacion === "LINK" ? data.linkPostulacion ?? null : null,
        categoriaId: data.categoria,
        logo: data.logo ?? null,
      };

      console.log("Create data:", createData);

      await createJobOfferMutation.mutateAsync({
        data: createData,
        token: session?.backendToken || "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setSubmitSuccess(null);
    router.push("/");
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <VolverButton />
      <header className="mb-8 space-y-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-center text-primary uppercase">Publicar empleo</h1>
        <p className="text-center text-muted-foreground">
          Publica una nueva oferta laboral en Puerto Madryn con Madryn Empleos.
        </p>
        <p className="text-center text-muted-foreground">
          Completa el formulario a continuación para conectar tu empresa con talento local.
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
                    placeholder="ej: Cocinero/a"
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
                <FormControl>
                  <Input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      onChange(file);
                    }}
                    className="border-primary/20 cursor-pointer focus-visible:ring-primary"
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
                      <X className="h-6 w-6" />
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
                    placeholder="ej: Restaurante Madryn"
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
                <Select onValueChange={field.onChange} value={field.value}>
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
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
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
                    className="border-primary/20 focus-visible:ring-primary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Anchor className="mr-2 h-4 w-4" />
                Publicar empleo
              </>
            )}
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground mt-2 text-center">
        Tu oferta será revisada por nuestro equipo antes de publicarse. Recibirás un email de confirmación.
      </p>

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
    </div>

  );
}
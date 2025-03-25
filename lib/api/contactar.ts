const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function createMessage(data: {
    nombre: string;
    apellido: string;
    email: string;
    mensaje: string;
}): Promise<string> {
    const response = await fetch(`${apiUrl}/api/contacto`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const responseText = await response.text();
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${responseText}`);
    }

    return responseText;
}
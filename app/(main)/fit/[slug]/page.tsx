interface FitPageProps {
  params: { slug: string };
}

export default function FitPage({ params }: FitPageProps) {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-2xl font-semibold">Fit: {params.slug}</h1>
    </main>
  );
}

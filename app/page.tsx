import { ImageConverter } from "@/components/image-converter"

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 md:mb-8 text-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Image Converter
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Convert your images to different formats with ease
          </p>
        </div>
        <ImageConverter />
      </div>
    </main>
  )
}

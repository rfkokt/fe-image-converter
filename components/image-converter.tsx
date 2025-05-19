"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import {
  AlertCircle,
  Check,
  Crop,
  Download,
  ImageIcon,
  Loader2,
  PackageOpen,
  RotateCw,
  Upload,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type ImageFile = {
  id: string;
  file: File;
  preview: string;
  edited?: string;
  rotation: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  uploadProgress?: number;
};

type ConversionOptions = {
  format: "webp" | "avif";
  quality: number;
};

type UploadError = {
  file: File;
  message: string;
};

export function ImageConverter() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [options, setOptions] = useState<ConversionOptions>({
    format: "webp",
    quality: 80,
  });
  const [isConverting, setIsConverting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCropping, setIsCropping] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedImage = images.find((img) => img.id === selectedImageId);

  // Clear errors after 5 seconds
  useEffect(() => {
    if (uploadErrors.length > 0) {
      const timer = setTimeout(() => {
        setUploadErrors([]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadErrors]);

  const validateFile = (file: File): boolean => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    const maxFileSize = 50 * 1024 * 1024; // 50MB limit

    if (!validTypes.includes(file.type)) {
      setUploadErrors((prev) => [
        ...prev,
        { file, message: "Unsupported file type" },
      ]);
      toast({
        title: "Unsupported file type",
        description: `${file.name} is not a supported image format.`,
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxFileSize) {
      setUploadErrors((prev) => [...prev, { file, message: "File too large" }]);
      toast({
        title: "File too large",
        description: `${file.name} exceeds the 50MB size limit.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };

      reader.onerror = () => {
        reject(new Error(`Failed to read file: ${file.name}`));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setIsUploading(true);
      const validFiles: File[] = [];

      // Validate files first
      Array.from(files).forEach((file) => {
        if (validateFile(file)) {
          validFiles.push(file);
        }
      });

      if (validFiles.length === 0) {
        setIsUploading(false);
        return;
      }

      // Show toast for upload start
      toast({
        title: "Uploading images",
        description: `Processing ${validFiles.length} image${
          validFiles.length > 1 ? "s" : ""
        }...`,
      });

      const newImages: ImageFile[] = [];
      let processedCount = 0;

      for (const file of validFiles) {
        try {
          // Create a unique ID for this image
          const id = `img-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}`;

          // Add image with 0% progress
          const newImage: ImageFile = {
            id,
            file,
            preview: "",
            rotation: 0,
            uploadProgress: 0,
          };

          setImages((prev) => [...prev, newImage]);

          // Simulate upload progress
          let progress = 0;
          const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) {
              clearInterval(progressInterval);
              progress = 90;
            }

            setImages((prev) =>
              prev.map((img) =>
                img.id === id
                  ? { ...img, uploadProgress: Math.min(progress, 90) }
                  : img
              )
            );
          }, 200);

          // Create preview
          const preview = await createImagePreview(file);

          // Clear interval and set to 100%
          clearInterval(progressInterval);

          // Update the image with the preview
          setImages((prev) =>
            prev.map((img) =>
              img.id === id ? { ...img, preview, uploadProgress: 100 } : img
            )
          );

          newImages.push({
            id,
            file,
            preview,
            rotation: 0,
          });

          processedCount++;

          // Update overall progress
          setProgress((processedCount / validFiles.length) * 100);
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          setUploadErrors((prev) => [
            ...prev,
            { file, message: "Failed to process file" },
          ]);
          toast({
            title: "Upload failed",
            description: `Failed to process ${file.name}.`,
            variant: "destructive",
          });
        }
      }

      // Set the first image as selected if none is selected
      if (!selectedImageId && newImages.length > 0) {
        setSelectedImageId(newImages[0].id);
      }

      // Show success toast
      if (processedCount > 0) {
        toast({
          title: "Upload complete",
          description: `Successfully processed ${processedCount} image${
            processedCount > 1 ? "s" : ""
          }.`,
          variant: "default",
        });
      }

      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setIsUploading(false);
    },
    [selectedImageId]
  );

  // Function to handle the "Add More" button click
  const handleAddMoreClick = useCallback(() => {
    if (fileInputRef.current) {
      // Reset the file input value to ensure onChange fires even if selecting the same file
      fileInputRef.current.value = "";
      // Trigger the file input click
      fileInputRef.current.click();
    } else {
      // Fallback if the ref is not available
      toast({
        title: "Cannot access file browser",
        description: "Please try dragging and dropping files instead.",
        variant: "destructive",
      });
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      // Check if the dataTransfer contains files
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files);
      } else {
        // Handle case where drag data might be something else (like text or HTML)
        toast({
          title: "Invalid drop",
          description: "Please drop image files only.",
          variant: "destructive",
        });
      }
    },
    [handleFileUpload]
  );

  // Handle paste from clipboard
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        handleFileUpload(e.clipboardData.files);
      }
    },
    [handleFileUpload]
  );

  // Add paste event listener
  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const rotateImage = useCallback(() => {
    if (!selectedImageId) return;

    setImages((prev) =>
      prev.map((img) =>
        img.id === selectedImageId
          ? { ...img, rotation: (img.rotation + 90) % 360 }
          : img
      )
    );
  }, [selectedImageId]);

  const startCropping = useCallback(() => {
    setIsCropping(true);
    // In a real implementation, we would initialize a cropping tool here
  }, []);

  const applyCrop = useCallback(() => {
    setIsCropping(false);
    // In a real implementation, we would apply the crop to the image
  }, []);

  const cancelCrop = useCallback(() => {
    setIsCropping(false);
  }, []);

  const convertImage = useCallback(
    async (img: ImageFile): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          const image = new Image();
          image.crossOrigin = "anonymous"; // Prevent CORS issues

          image.onload = () => {
            try {
              const width = image.width;
              const height = image.height;

              // Handle rotation
              if (img.rotation === 90 || img.rotation === 270) {
                canvas.width = height;
                canvas.height = width;
              } else {
                canvas.width = width;
                canvas.height = height;
              }

              ctx.save();

              // Translate and rotate
              if (img.rotation > 0) {
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((img.rotation * Math.PI) / 180);
                ctx.translate(-image.width / 2, -image.height / 2);
              }

              // Draw the image
              ctx.drawImage(image, 0, 0);

              ctx.restore();

              // Convert to the selected format
              let mimeType = "image/jpeg";
              if (options.format === "webp") mimeType = "image/webp";
              if (options.format === "avif") mimeType = "image/avif";

              canvas.toBlob(
                (blob) => {
                  if (blob) resolve(blob);
                  else reject(new Error("Failed to create blob"));
                },
                mimeType,
                options.quality / 100
              );
            } catch (err) {
              reject(err);
            }
          };

          image.onerror = () => {
            reject(new Error("Failed to load image"));
          };

          image.src = img.edited || img.preview;
        } catch (err) {
          reject(err);
        }
      });
    },
    [options]
  );

  const downloadSingleImage = useCallback(
    async (img: ImageFile) => {
      try {
        setIsConverting(true);
        const blob = await convertImage(img);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const extension = options.format;

        // Get original filename without extension
        const originalName = img.file.name.replace(/\.[^/.]+$/, "");

        a.href = url;
        a.download = `${originalName}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up to avoid memory leaks

        toast({
          title: "Download complete",
          description: `${originalName}.${extension} has been downloaded.`,
        });
      } catch (error) {
        console.error("Error downloading image:", error);
        toast({
          title: "Download failed",
          description: "There was an error downloading your image.",
          variant: "destructive",
        });
      } finally {
        setIsConverting(false);
      }
    },
    [convertImage, options.format]
  );

  const convertImagesBatch = async (
    images: ImageFile[],
    format: string
  ): Promise<Blob> => {
    const formData = new FormData();
    images.forEach((img) => {
      formData.append("files", img.file);
      formData.append("quality", options.quality.toString());
    });
    formData.append("format", format);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Batch conversion failed");
    }

    return await response.blob(); // ZIP blob
  };

  const downloadAllImages = useCallback(async () => {
    if (images.length === 0) return;
    setIsConverting(true);

    try {
      toast({
        title: "Preparing download",
        description: `Converting ${images.length} images...`,
      });

      const zipBlob = await convertImagesBatch(images, options.format);

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `images-converted.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download complete",
        description: `All images have been downloaded as a zip file.`,
      });
    } catch (error) {
      console.error("Batch download failed", error);
      toast({
        title: "Download failed",
        description: "There was an error creating your zip file.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  }, [images, options.format]);

  const removeImage = useCallback(
    (id: string) => {
      setImages((prev) => prev.filter((img) => img.id !== id));
      if (selectedImageId === id) {
        setSelectedImageId(images.length > 1 ? images[0].id : null);
      }
    },
    [images, selectedImageId]
  );

  const removeAllImages = useCallback(() => {
    setImages([]);
    setSelectedImageId(null);
    toast({
      title: "All images cleared",
      description: "All images have been removed.",
    });
  }, []);

  return (
    <>
      {/* Hidden file input for uploads */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        onChange={(e) => {
          handleFileUpload(e.target.files);
          // Reset value after handling to allow selecting the same file again
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 relative">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2 md:mb-4">
            <h2 className="text-lg md:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Image Converter
            </h2>
            <ThemeToggle />
          </div>

          {uploadErrors.length > 0 && (
            <Alert variant="destructive" className="mb-4 glass">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Upload Errors</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2">
                  {uploadErrors.map((error, index) => (
                    <li key={index}>
                      {error.file.name}: {error.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {images.length === 0 ? (
            <div
              ref={dropAreaRef}
              className={`glass border-2 border-dashed rounded-lg p-6 md:p-12 text-center transition-all duration-300 
                ${
                  dragActive
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                    : "hover:border-primary hover:bg-primary/5"
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-8 w-8 md:h-12 md:w-12 text-primary mb-2 md:mb-4 animate-float" />
              <h3 className="text-base md:text-lg font-medium mb-1 md:mb-2">
                {dragActive ? "Drop images here" : "Drag & Drop Images Here"}
              </h3>
              <p className="text-sm text-muted-foreground mb-2 md:mb-4">
                Or click to browse your files
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: JPG, PNG, GIF, WEBP, SVG
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                You can also paste images from clipboard (Ctrl+V)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {isUploading && (
                <div className="mb-4 glass-card p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      Uploading images...
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {selectedImage && (
                <div className="relative glass-card p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium truncate max-w-[250px]">
                      {selectedImage.file.name}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={rotateImage}
                        title="Rotate"
                        className="glass-button"
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      {!isCropping ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={startCropping}
                          title="Crop"
                          className="glass-button"
                        >
                          <Crop className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={applyCrop}
                          >
                            Apply Crop
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelCrop}
                            className="glass-button"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => downloadSingleImage(selectedImage)}
                        title="Download"
                        disabled={isConverting}
                        className="glass-button"
                      >
                        {isConverting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="relative flex justify-center">
                    <canvas ref={canvasRef} className="hidden" />
                    {selectedImage.preview ? (
                      <img
                        src={selectedImage.preview || "/placeholder.svg"}
                        alt={selectedImage.file.name}
                        className="max-h-[400px] object-contain rounded-lg shadow-md"
                        style={{
                          transform: `rotate(${selectedImage.rotation}deg)`,
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[200px] w-full">
                        <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                        <p className="text-sm text-muted-foreground">
                          Loading preview...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="glass-card p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">All Images ({images.length})</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeAllImages}
                      disabled={images.length === 0}
                      className="glass-button"
                    >
                      Clear All
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={downloadAllImages}
                      disabled={images.length === 0 || isConverting}
                    >
                      {isConverting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <PackageOpen className="mr-2 h-4 w-4" />
                          Download All
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {isConverting && <Progress value={progress} className="mb-4" />}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 mt-2 md:mt-4">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className={`relative glass-card overflow-hidden cursor-pointer group transition-all duration-300 ${
                        selectedImageId === img.id
                          ? "ring-2 ring-primary shadow-lg shadow-primary/20"
                          : ""
                      }`}
                      onClick={() => setSelectedImageId(img.id)}
                    >
                      <div className="aspect-square relative">
                        {img.preview ? (
                          <img
                            src={img.preview || "/placeholder.svg"}
                            alt={img.file.name}
                            className="w-full h-full object-cover"
                            style={{
                              transform: `rotate(${img.rotation}deg)`,
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted/50">
                            {img.uploadProgress !== undefined &&
                            img.uploadProgress < 100 ? (
                              <>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Progress
                                    value={img.uploadProgress}
                                    className="w-2/3 h-2"
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground absolute bottom-2 right-2">
                                  {Math.round(img.uploadProgress)}%
                                </span>
                              </>
                            ) : (
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                        )}
                        <button
                          className="absolute top-1 right-1 bg-background/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(img.id);
                          }}
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {img.uploadProgress === 100 && (
                          <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs truncate">{img.file.name}</p>
                      </div>
                    </div>
                  ))}

                  {/* Enhanced Add More button with better feedback */}
                  <div
                    className="glass border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-300"
                    onClick={handleAddMoreClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleAddMoreClick();
                      }
                    }}
                    aria-label="Add more images"
                  >
                    <Upload className="h-8 w-8 text-primary mb-2 animate-float" />
                    <p className="text-xs text-center text-muted-foreground">
                      Add More
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating right panel with sticky positioning */}
        <div className="hidden lg:block">
          <div className="sticky top-4 glass-card p-6">
            <h2 className="text-xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Conversion Options
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Output Format</h3>
                <RadioGroup
                  value={options.format}
                  onValueChange={(value) =>
                    setOptions({
                      ...options,
                      format: value as ConversionOptions["format"],
                    })
                  }
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="avif" id="avif" />
                    <Label htmlFor="avif">AVIF</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="webp" id="webp" />
                    <Label htmlFor="webp">WEBP</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Quality</h3>
                  <span className="text-sm text-muted-foreground">
                    {options.quality}%
                  </span>
                </div>
                <Slider
                  value={[options.quality]}
                  min={1}
                  max={100}
                  step={1}
                  onValueChange={(value) =>
                    setOptions({ ...options, quality: value[0] })
                  }
                />
              </div>

              <div className="pt-4 border-t border-border/30">
                <h3 className="font-medium mb-3">Image Information</h3>
                {selectedImage ? (
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Name:</span>{" "}
                      {selectedImage.file.name}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Type:</span>{" "}
                      {selectedImage.file.type}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Size:</span>{" "}
                      {(selectedImage.file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No image selected
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile version of the options panel */}
        <div className="lg:hidden glass-card p-6">
          <h2 className="text-xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Conversion Options
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Output Format</h3>
              <RadioGroup
                value={options.format}
                onValueChange={(value) =>
                  setOptions({
                    ...options,
                    format: value as ConversionOptions["format"],
                  })
                }
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="jpg" id="jpg-mobile" />
                  <Label htmlFor="jpg-mobile">JPG</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="png" id="png-mobile" />
                  <Label htmlFor="png-mobile">PNG</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="webp" id="webp-mobile" />
                  <Label htmlFor="webp-mobile">WEBP</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Quality</h3>
                <span className="text-sm text-muted-foreground">
                  {options.quality}%
                </span>
              </div>
              <Slider
                value={[options.quality]}
                min={1}
                max={100}
                step={1}
                onValueChange={(value) =>
                  setOptions({ ...options, quality: value[0] })
                }
              />
            </div>

            <div className="pt-4 border-t border-border/30">
              <h3 className="font-medium mb-3">Image Information</h3>
              {selectedImage ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {selectedImage.file.name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Type:</span>{" "}
                    {selectedImage.file.type}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Size:</span>{" "}
                    {(selectedImage.file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No image selected
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}

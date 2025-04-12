
"use client";

import { useState } from "react";
import { generateImageCaptions } from "@/ai/flows/generate-image-captions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [captions, setCaptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCaptionGeneration = async () => {
    if (!image) {
      toast({
        title: "Please upload an image first.",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await generateImageCaptions({ photoUrl: image });
      setCaptions(result.captions);
    } catch (error: any) {
      console.error("Error generating captions:", error);
      toast({
        title: "Error generating captions.",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption);
    toast({
      title: "Caption copied to clipboard!",
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-bold mb-4">CaptionGenie</h1>

      <div className="flex flex-col items-center mb-4">
        {image ? (
          <img
            src={image}
            alt="Uploaded"
            className="max-w-md max-h-64 rounded-md shadow-md mb-2"
          />
        ) : (
          <div className="border-2 border-dashed rounded-md p-4 text-muted-foreground">
            No image uploaded yet.
          </div>
        )}
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={loading}
        />
      </div>

      <Button onClick={handleCaptionGeneration} disabled={loading}>
        {loading ? "Generating..." : <><Upload className="mr-2 h-4 w-4"/> Generate Captions</>}
      </Button>

      <div className="mt-6 w-full max-w-md">
        {captions.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-2">Generated Captions:</h2>
            {captions.map((caption, index) => (
              <div key={index} className="mb-4 rounded-md shadow-sm border p-4">
                <Textarea
                  readOnly
                  value={caption}
                  className="resize-none border-none shadow-none focus-visible:ring-0"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopyCaption(caption)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

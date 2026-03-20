import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Modal, Slider } from "antd";

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void;
  cropShape?: "rect" | "round";
  aspect?: number;
  title?: string;
}

export function ImageCropModal({
  open,
  imageSrc,
  onCancel,
  onConfirm,
  cropShape = "rect",
  aspect = 1,
  title = "Crop Image",
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [confirming, setConfirming] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    setConfirming(true);
    try {
      const file = await getCroppedImage(imageSrc, croppedAreaPixels);
      onConfirm(file);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      onOk={handleConfirm}
      okText="Crop & Upload"
      cancelText="Cancel"
      confirmLoading={confirming}
      width={520}
      destroyOnClose
    >
      <div
        style={{ position: "relative", width: "100%", height: 360, background: "#333" }}
        className="rounded-lg overflow-hidden"
      >
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={cropShape}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="mt-4 px-2">
        <span className="text-sm text-text-muted">Zoom</span>
        <Slider
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={setZoom}
        />
      </div>
    </Modal>
  );
}

function getCroppedImage(imageSrc: string, pixelCrop: Area): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          resolve(new File([blob], "cropped.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92,
      );
    };
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageSrc;
  });
}

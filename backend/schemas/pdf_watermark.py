# backend\schemas\pdf_watermark.py

from typing import Literal
from pydantic import BaseModel, Field


class WatermarkBase(BaseModel):
    type: Literal["text", "image"]
    opacity: float = Field(0.1, ge=0, le=1)
    angle: float = 45
    save_as_image: bool = False
    dpi: int = 300


class TextWatermark(WatermarkBase):
    type: Literal["text"] = "text"
    text: str
    font: str = "Helvetica"
    font_size: int = 24
    color: str = "#000000"


class ImageWatermark(WatermarkBase):
    type: Literal["image"] = "image"
    image_scale: float = 1.0


class GridOptions(BaseModel):
    mode: Literal["grid"] = "grid"
    tile_type: Literal["straight", "diagonal"] = "straight"
    horizontal_boxes: int = 3
    vertical_boxes: int = 6


class InsertOptions(BaseModel):
    mode: Literal["insert"] = "insert"
    x: float = Field(0.5, ge=0, le=1)
    y: float = Field(0.5, ge=0, le=1)
    horizontal_alignment: Literal["left", "center", "right"] = "center"


class WatermarkRequest(BaseModel):
    watermark: TextWatermark | ImageWatermark
    placement: GridOptions | InsertOptions

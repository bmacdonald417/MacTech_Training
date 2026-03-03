-- Add admin-editable TTS input text to narration assets
ALTER TABLE "NarrationAsset"
ADD COLUMN "inputText" TEXT;


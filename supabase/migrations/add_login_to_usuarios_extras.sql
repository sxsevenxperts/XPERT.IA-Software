-- Add login_usuario and senha_usuario columns to usuarios_extras for free first member feature
ALTER TABLE usuarios_extras
ADD COLUMN IF NOT EXISTS login_usuario VARCHAR(255),
ADD COLUMN IF NOT EXISTS senha_usuario VARCHAR(255);

-- Create index for login lookups
CREATE INDEX IF NOT EXISTS idx_usuarios_extras_login ON usuarios_extras(login_usuario);

-- Update content_types table
ALTER TABLE content_types
ADD COLUMN title TEXT NOT NULL;

-- Update contents table to support rich text and structured content
ALTER TABLE contents
ALTER COLUMN data TYPE JSONB;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create authors table
CREATE TABLE IF NOT EXISTS authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_categories junction table
CREATE TABLE IF NOT EXISTS content_categories (
  content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, category_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contents_type_id ON contents(type_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_authors_email ON authors(email);
CREATE INDEX IF NOT EXISTS idx_content_categories_content_id ON content_categories(content_id);
CREATE INDEX IF NOT EXISTS idx_content_categories_category_id ON content_categories(category_id); 
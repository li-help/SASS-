-- V4__cascade_delete.sql

-- Alter comment table foreign key to cascade delete
ALTER TABLE comment DROP CONSTRAINT IF EXISTS comment_document_id_fkey;
ALTER TABLE comment ADD CONSTRAINT comment_document_id_fkey 
    FOREIGN KEY (document_id) REFERENCES document(id) ON DELETE CASCADE;

-- Alter document_version table foreign key to cascade delete
ALTER TABLE document_version DROP CONSTRAINT IF EXISTS document_version_document_id_fkey;
ALTER TABLE document_version ADD CONSTRAINT document_version_document_id_fkey 
    FOREIGN KEY (document_id) REFERENCES document(id) ON DELETE CASCADE;

PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;

DROP TABLE IF EXISTS "TeamAdminLink";
DROP TABLE IF EXISTS "TeamMemberLink";
DROP TABLE IF EXISTS "TeamAwaiting";
DROP TABLE IF EXISTS "Credential";
DROP TABLE IF EXISTS "Team";
DROP TABLE IF EXISTS "User";

CREATE TABLE IF NOT EXISTS "User" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "username" TEXT NOT NULL,
    "hashed_password" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "encrypted_private_key" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Team" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Credential" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "edited" BOOLEAN NOT NULL DEFAULT 0,
    "group" TEXT DEFAULT '',
    "record_name" TEXT,
    "url" TEXT,
    "login" TEXT NOT NULL,
    "team_id" INTEGER,
    FOREIGN KEY("team_id") REFERENCES "Team"("id")
);

CREATE TABLE IF NOT EXISTS "CredentialSecret" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "password" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "credential_id" INTEGER NOT NULL,
    FOREIGN KEY("user_id") REFERENCES "User"("id"),
    FOREIGN KEY("credential_id") REFERENCES "Credential"("id")
);

CREATE INDEX IF NOT EXISTS "credential_name_index"
ON "Credential" ("record_name");
CREATE INDEX IF NOT EXISTS "credential_site_index"
ON "Credential" ("url");

CREATE TABLE IF NOT EXISTS "TeamMemberLink" (
    "team_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    PRIMARY KEY ("team_id", "user_id"),
    FOREIGN KEY("team_id") REFERENCES "Team"("id"),
    FOREIGN KEY("user_id") REFERENCES "User"("id")
);

CREATE TABLE IF NOT EXISTS "TeamAdminLink" (
    "team_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    PRIMARY KEY ("team_id", "user_id"),
    FOREIGN KEY("team_id") REFERENCES "Team"("id"),
    FOREIGN KEY("user_id") REFERENCES "User"("id")
);

CREATE TABLE IF NOT EXISTS "TeamAwaiting" (
    "team_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    PRIMARY KEY ("team_id", "user_id"),
    FOREIGN KEY("team_id") REFERENCES "Team"("id"),
    FOREIGN KEY("user_id") REFERENCES "User"("id")
);

COMMIT;
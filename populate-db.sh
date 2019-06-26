#!/bin/bash

database="postgres"
username="root"
hostname="172.22.0.1"

PGPASSFILE="./.pgpass" psql -d $database -h $hostname -U $username -w -c '
CREATE TABLE "AnonUser" (
	"UserGroup_id" uuid NOT NULL,
	"_id" uuid NOT NULL,
	"_created" timestamp with time zone NOT NULL,
	"entry_hash" TEXT NOT NULL UNIQUE,
	CONSTRAINT "AnonUser_pk" PRIMARY KEY ("_id")
) WITH (
  OIDS=FALSE
)' -c '
CREATE TABLE "SurveyResult" (
	"UserGroup_id" uuid NOT NULL,
	"AnonUser_id" uuid NOT NULL,
	"_id" uuid NOT NULL,
	"_created" timestamp with time zone NOT NULL,
	"health" integer NOT NULL,
	"overcoming" integer NOT NULL,
	"living" integer NOT NULL,
	"coping" integer NOT NULL,
	"family" integer NOT NULL,
	"friends" integer NOT NULL,
	"finance" integer NOT NULL,
	"strengths" integer NOT NULL,
	"self_esteem" integer NOT NULL,
	"life_as_whole" integer NOT NULL,
	"health_desc" TEXT,
	"overcoming_desc" TEXT,
	"living_desc" TEXT,
	"coping_desc" TEXT,
	"family_desc" TEXT,
	"friends_desc" TEXT,
	"finance_desc" TEXT,
	"strengths_desc" TEXT,
	"self_esteem_desc" TEXT,
	"life_as_whole_desc" TEXT,
	CONSTRAINT "SurveyResult_pk" PRIMARY KEY ("_id")
) WITH (
  OIDS=FALSE
)
' -c '
CREATE TABLE "UserGroup" (
	"Admin_id" uuid NOT NULL,
	"_id" uuid NOT NULL,
	"_created" timestamp with time zone NOT NULL,
	CONSTRAINT "UserGroup_pk" PRIMARY KEY ("_id")
) WITH (
  OIDS=FALSE
)
' -c '
CREATE TABLE "Admin" (
	"_id" uuid NOT NULL,
	"_created" timestamp with time zone NOT NULL,
	"username" TEXT NOT NULL UNIQUE,
	"password" TEXT NOT NULL,
	CONSTRAINT "Admin_pk" PRIMARY KEY ("_id")
) WITH (
  OIDS=FALSE
)
' -c '
ALTER TABLE "AnonUser" ADD CONSTRAINT "AnonUser_fk0" FOREIGN KEY ("UserGroup_id") REFERENCES "UserGroup"("_id")
' -c '
ALTER TABLE "SurveyResult" ADD CONSTRAINT "SurveyResult_fk0" FOREIGN KEY ("UserGroup_id") REFERENCES "UserGroup"("_id")
' -c '
ALTER TABLE "SurveyResult" ADD CONSTRAINT "SurveyResult_fk1" FOREIGN KEY ("AnonUser_id") REFERENCES "AnonUser"("_id")
' -c '
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_fk0" FOREIGN KEY ("Admin_id") REFERENCES "Admin"("_id")
'
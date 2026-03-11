--
-- PostgreSQL database dump
--

\restrict slt2WlozopPF67rRwcXXVsPATEt9mSlALF4OMWRDeyhYXuApSfO700DNrpJiTzh

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AchievementType; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."AchievementType" AS ENUM (
    'FIRST_BLOOD',
    'HOT_STREAK',
    'REFERRAL_KING',
    'SPEED_DEMON',
    'BULLSEYE',
    'PIONEER_LEGEND',
    'BIG_SPENDER',
    'LOYAL_CUSTOMER',
    'EARLY_ADOPTER',
    'SOCIAL_BUTTERFLY'
);


ALTER TYPE public."AchievementType" OWNER TO smmuser;

--
-- Name: BugSeverity; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."BugSeverity" AS ENUM (
    'MINOR',
    'MAJOR',
    'CRITICAL'
);


ALTER TYPE public."BugSeverity" OWNER TO smmuser;

--
-- Name: BugStatus; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."BugStatus" AS ENUM (
    'PENDING',
    'REVIEWING',
    'ACCEPTED',
    'REJECTED',
    'DUPLICATE'
);


ALTER TYPE public."BugStatus" OWNER TO smmuser;

--
-- Name: BusinessExpenseType; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."BusinessExpenseType" AS ENUM (
    'ADVERTISING',
    'SALARIES',
    'INFRASTRUCTURE',
    'SERVICES',
    'OTHER'
);


ALTER TYPE public."BusinessExpenseType" OWNER TO smmuser;

--
-- Name: Category; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."Category" AS ENUM (
    'SUBSCRIBERS',
    'LIKES',
    'VIEWS',
    'REACTIONS',
    'REPOSTS',
    'COMMENTS',
    'OTHER',
    'BOOSTS',
    'POLLS',
    'STORIES',
    'BOTS',
    'REFERRALS',
    'FRIENDS',
    'PLAYS',
    'RECOVER',
    'PREMIUM',
    'TRAFFIC',
    'DISLIKES',
    'GROUPS',
    'STREAMS',
    'WATCH_TIME',
    'SAVES',
    'STARS'
);


ALTER TYPE public."Category" OWNER TO smmuser;

--
-- Name: ChallengeType; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."ChallengeType" AS ENUM (
    'TRIPLE_THREAT',
    'SOCIAL_SHARE',
    'EARLY_BIRD',
    'WEEKEND_WARRIOR',
    'SPENDING_SPREE'
);


ALTER TYPE public."ChallengeType" OWNER TO smmuser;

--
-- Name: Currency; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."Currency" AS ENUM (
    'RUB',
    'USD',
    'EUR',
    'KZT',
    'UAH',
    'TRY',
    'IDR',
    'INR',
    'THB',
    'VND'
);


ALTER TYPE public."Currency" OWNER TO smmuser;

--
-- Name: ExpenseCategory; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."ExpenseCategory" AS ENUM (
    'SALARY',
    'MARKETING',
    'SEO',
    'ADS',
    'TAX',
    'SERVER',
    'OFFICE',
    'OTHER'
);


ALTER TYPE public."ExpenseCategory" OWNER TO smmuser;

--
-- Name: LedgerEntryType; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."LedgerEntryType" AS ENUM (
    'DEPOSIT',
    'WITHDRAWAL',
    'REFUND',
    'REFERRAL_BONUS',
    'LOYALTY_BONUS',
    'MANUAL_ADJUSTMENT'
);


ALTER TYPE public."LedgerEntryType" OWNER TO smmuser;

--
-- Name: MessageSender; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."MessageSender" AS ENUM (
    'USER',
    'STAFF',
    'SYSTEM',
    'INTERNAL'
);


ALTER TYPE public."MessageSender" OWNER TO smmuser;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'PARTIAL',
    'CANCELED',
    'AWAITING_PAYMENT',
    'IN_PROGRESS'
);


ALTER TYPE public."OrderStatus" OWNER TO smmuser;

--
-- Name: Platform; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."Platform" AS ENUM (
    'TELEGRAM',
    'INSTAGRAM',
    'VK',
    'TIKTOK',
    'YOUTUBE',
    'FACEBOOK',
    'TWITTER',
    'OTHER',
    'DISCORD',
    'THREADS',
    'REDDIT',
    'TWITCH',
    'KICK',
    'RUTUBE',
    'DZEN',
    'MUSIC',
    'OK',
    'LIKEE',
    'WHATSAPP',
    'SPOTIFY',
    'SOUNDCLOUD',
    'LINKEDIN',
    'PINTEREST',
    'SNAPCHAT',
    'TROVO',
    'KWAI',
    'MESSENGER_MAX',
    'GOOGLE',
    'APPLE',
    'YANDEX',
    'STEAM',
    'RUMBLE',
    'TUMBLR',
    'VIMEO',
    'SHAZAM',
    'QUORA',
    'MEDIUM',
    'WEBSITE',
    'PERISCOPE',
    'CLOUDHUB',
    'AUDIOMACK',
    'DATPIFF',
    'MAX'
);


ALTER TYPE public."Platform" OWNER TO smmuser;

--
-- Name: ProviderPaymentType; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."ProviderPaymentType" AS ENUM (
    'TOPUP',
    'REFUND',
    'ADJUSTMENT'
);


ALTER TYPE public."ProviderPaymentType" OWNER TO smmuser;

--
-- Name: ReviewStatus; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."ReviewStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."ReviewStatus" OWNER TO smmuser;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'ADMIN',
    'RESELLER',
    'SUPPORT',
    'SEO'
);


ALTER TYPE public."Role" OWNER TO smmuser;

--
-- Name: ServiceManagementMode; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."ServiceManagementMode" AS ENUM (
    'MANUAL',
    'SMART_IMPORT'
);


ALTER TYPE public."ServiceManagementMode" OWNER TO smmuser;

--
-- Name: ServiceType; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."ServiceType" AS ENUM (
    'REGULAR',
    'BUNDLE'
);


ALTER TYPE public."ServiceType" OWNER TO smmuser;

--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'OPEN',
    'PENDING',
    'CLOSED'
);


ALTER TYPE public."TicketStatus" OWNER TO smmuser;

--
-- Name: TransactionStatus; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."TransactionStatus" AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED',
    'COMPLETED',
    'ERROR'
);


ALTER TYPE public."TransactionStatus" OWNER TO smmuser;

--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: smmuser
--

CREATE TYPE public."TransactionType" AS ENUM (
    'DEPOSIT',
    'WITHDRAW',
    'REFUND',
    'WITHDRAWAL',
    'ORDER_PAYMENT',
    'NEW_ORDER',
    'ORDER_STATUS_CHANGE'
);


ALTER TYPE public."TransactionType" OWNER TO smmuser;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Achievement; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."Achievement" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."AchievementType" NOT NULL,
    "unlockedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    claimed boolean DEFAULT false NOT NULL,
    "claimedAt" timestamp(3) without time zone
);


ALTER TABLE public."Achievement" OWNER TO smmuser;

--
-- Name: AdminLog; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."AdminLog" (
    id text NOT NULL,
    "adminId" text NOT NULL,
    action text NOT NULL,
    "targetId" text,
    details text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AdminLog" OWNER TO smmuser;

--
-- Name: AutoMonitoring; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."AutoMonitoring" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    "userId" text NOT NULL,
    "internalServiceId" text NOT NULL,
    link text NOT NULL,
    quantity integer NOT NULL,
    "postsLimit" integer NOT NULL,
    "postsProcessed" integer DEFAULT 0 NOT NULL,
    "lastPostId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "delayMinutes" integer DEFAULT 0 NOT NULL,
    "dripInterval" integer,
    "dripRuns" integer,
    "isDripFeed" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."AutoMonitoring" OWNER TO smmuser;

--
-- Name: BatchOrder; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."BatchOrder" (
    id text NOT NULL,
    "projectId" text,
    "userId" text NOT NULL,
    "totalAmount" numeric(20,2) NOT NULL,
    "orderCount" integer NOT NULL,
    status text DEFAULT 'COMPLETED'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BatchOrder" OWNER TO smmuser;

--
-- Name: BugReport; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."BugReport" (
    id text NOT NULL,
    "userId" text,
    "projectId" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    severity public."BugSeverity" DEFAULT 'MINOR'::public."BugSeverity" NOT NULL,
    status public."BugStatus" DEFAULT 'PENDING'::public."BugStatus" NOT NULL,
    "screenshotUrl" text,
    "stepsToReproduce" text,
    "rewardAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    "rewardPaid" boolean DEFAULT false NOT NULL,
    "adminNotes" text,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BugReport" OWNER TO smmuser;

--
-- Name: BusinessExpense; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."BusinessExpense" (
    id text NOT NULL,
    "projectId" text,
    category public."ExpenseCategory" NOT NULL,
    amount numeric(20,2) NOT NULL,
    description text,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."BusinessExpense" OWNER TO smmuser;

--
-- Name: Challenge; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."Challenge" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."ChallengeType" NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    target integer NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    completed boolean DEFAULT false NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Challenge" OWNER TO smmuser;

--
-- Name: ChurnPrediction; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."ChurnPrediction" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "predictedChurn" numeric(5,2) NOT NULL,
    "confidenceScore" numeric(3,2) NOT NULL,
    "recommendedAction" text,
    "notificationSent" boolean DEFAULT false NOT NULL,
    "orderId" integer NOT NULL
);


ALTER TABLE public."ChurnPrediction" OWNER TO smmuser;

--
-- Name: ChurnSnapshot; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."ChurnSnapshot" (
    id text NOT NULL,
    "snapshotDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "subscriberCount" integer NOT NULL,
    "daysElapsed" integer NOT NULL,
    "dropoffRate" numeric(5,2) NOT NULL,
    "orderId" integer NOT NULL,
    metadata jsonb
);


ALTER TABLE public."ChurnSnapshot" OWNER TO smmuser;

--
-- Name: CurrencyRate; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."CurrencyRate" (
    code public."Currency" NOT NULL,
    rate numeric(20,6) NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CurrencyRate" OWNER TO smmuser;

--
-- Name: GlobalSetting; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."GlobalSetting" (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."GlobalSetting" OWNER TO smmuser;

--
-- Name: InternalService; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."InternalService" (
    id text NOT NULL,
    platform public."Platform" NOT NULL,
    category public."Category" NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    geo text NOT NULL,
    "pricePer1000" numeric(20,2) NOT NULL,
    "minQty" integer NOT NULL,
    "maxQty" integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    rating double precision DEFAULT 5.0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "priceUnit" integer DEFAULT 1000 NOT NULL,
    "unitName" text DEFAULT 'шт.'::text NOT NULL,
    "avgCompletionTime" integer DEFAULT 0 NOT NULL,
    "lastProviderPrice" numeric(20,4),
    "statusCount" jsonb,
    "successRate" double precision DEFAULT 100.0 NOT NULL,
    "isPrivate" boolean DEFAULT false NOT NULL,
    "targetType" text DEFAULT 'POST'::text NOT NULL,
    "avgDropRate" double precision DEFAULT 0.0 NOT NULL,
    "guaranteeDays" integer DEFAULT 30 NOT NULL,
    "isCurated" boolean DEFAULT false NOT NULL,
    metadata jsonb,
    requirements text,
    slug text,
    "isDripFeedDisabled" boolean DEFAULT false NOT NULL,
    "marketPrice" numeric(20,2),
    markup numeric(10,2),
    "numericId" integer NOT NULL,
    "providerCurrencyOriginal" text,
    "providerPriceOriginal" numeric(20,6),
    type public."ServiceType" DEFAULT 'REGULAR'::public."ServiceType" NOT NULL,
    "categoryId" text,
    "socialPlatformId" text,
    "allowedTargetTypes" text[] DEFAULT ARRAY[]::text[]
);


ALTER TABLE public."InternalService" OWNER TO smmuser;

--
-- Name: InternalServiceMapping; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."InternalServiceMapping" (
    id text NOT NULL,
    "internalServiceId" text NOT NULL,
    "providerServiceId" text NOT NULL,
    priority integer DEFAULT 1 NOT NULL,
    reliability double precision DEFAULT 100.0 NOT NULL,
    "speedRating" double precision DEFAULT 5.0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "providerId" text NOT NULL,
    "projectId" text
);


ALTER TABLE public."InternalServiceMapping" OWNER TO smmuser;

--
-- Name: InternalService_numericId_seq; Type: SEQUENCE; Schema: public; Owner: smmuser
--

CREATE SEQUENCE public."InternalService_numericId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."InternalService_numericId_seq" OWNER TO smmuser;

--
-- Name: InternalService_numericId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: smmuser
--

ALTER SEQUENCE public."InternalService_numericId_seq" OWNED BY public."InternalService"."numericId";


--
-- Name: LedgerEntry; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."LedgerEntry" (
    id text NOT NULL,
    "projectId" text,
    "userId" text NOT NULL,
    amount numeric(20,2) NOT NULL,
    currency public."Currency" DEFAULT 'RUB'::public."Currency" NOT NULL,
    "balanceBefore" numeric(20,2) NOT NULL,
    "balanceAfter" numeric(20,2) NOT NULL,
    type public."LedgerEntryType" NOT NULL,
    "referenceId" text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LedgerEntry" OWNER TO smmuser;

--
-- Name: LegalDocument; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."LegalDocument" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LegalDocument" OWNER TO smmuser;

--
-- Name: LoyaltyLog; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."LoyaltyLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "projectId" text,
    trigger text NOT NULL,
    reward text NOT NULL,
    value numeric(20,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LoyaltyLog" OWNER TO smmuser;

--
-- Name: ManagedChannel; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."ManagedChannel" (
    id text NOT NULL,
    "projectId" text,
    "userId" text NOT NULL,
    "chatId" bigint NOT NULL,
    username text,
    title text,
    "isActive" boolean DEFAULT true NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb,
    "serviceId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ManagedChannel" OWNER TO smmuser;

--
-- Name: NPSSurvey; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."NPSSurvey" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "projectId" text,
    score integer NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "orderId" integer
);


ALTER TABLE public."NPSSurvey" OWNER TO smmuser;

--
-- Name: News; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."News" (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "imageUrl" text,
    "isSent" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "projectId" text
);


ALTER TABLE public."News" OWNER TO smmuser;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."Order" (
    "userId" text NOT NULL,
    "internalServiceId" text NOT NULL,
    "externalId" text,
    link text NOT NULL,
    quantity integer NOT NULL,
    "totalPrice" numeric(20,2) NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    remains integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "inviteLink" text,
    "discountAmount" numeric(20,2),
    "promoCodeId" text,
    "currentRun" integer DEFAULT 0 NOT NULL,
    "interval" integer DEFAULT 0 NOT NULL,
    "isDripFeed" boolean DEFAULT false NOT NULL,
    "nextRunAt" timestamp(3) without time zone,
    runs integer DEFAULT 1 NOT NULL,
    "providerRawResponse" jsonb,
    "providerName" text,
    comments text,
    "costPrice" numeric(20,4),
    "refundedAmount" numeric(20,2) DEFAULT 0.00 NOT NULL,
    "batchOrderId" text,
    "projectId" text,
    "currentCount" integer,
    "initialCount" integer,
    "lastCheckedAt" timestamp(3) without time zone,
    "warrantyDays" integer,
    "managedChannelId" text,
    id integer NOT NULL,
    "parentId" integer,
    "isManual" boolean DEFAULT false NOT NULL,
    metadata jsonb
);


ALTER TABLE public."Order" OWNER TO smmuser;

--
-- Name: Order_id_seq; Type: SEQUENCE; Schema: public; Owner: smmuser
--

CREATE SEQUENCE public."Order_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Order_id_seq" OWNER TO smmuser;

--
-- Name: Order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: smmuser
--

ALTER SEQUENCE public."Order_id_seq" OWNED BY public."Order".id;


--
-- Name: Project; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."Project" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    domain text NOT NULL,
    "botToken" text,
    "botUsername" text,
    config jsonb,
    "maintenanceMode" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "brandColor" text DEFAULT '#3b82f6'::text NOT NULL,
    "pricingRules" jsonb,
    "safetySettings" jsonb,
    "paymentSettings" jsonb,
    "loyaltySettings" jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDripFeedDisabled" boolean DEFAULT false NOT NULL,
    "marketerSettings" jsonb,
    markup numeric(10,2),
    "serviceManagementMode" public."ServiceManagementMode" DEFAULT 'SMART_IMPORT'::public."ServiceManagementMode" NOT NULL
);


ALTER TABLE public."Project" OWNER TO smmuser;

--
-- Name: ProjectServiceOverride; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."ProjectServiceOverride" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    "internalServiceId" text NOT NULL,
    "categoryId" text,
    "customPrice" numeric(20,2),
    "isActive" boolean DEFAULT true NOT NULL,
    "customDescription" text,
    "customMaxQty" integer,
    "customMinQty" integer,
    "customName" text,
    "customRequirements" text,
    markup numeric(10,2)
);


ALTER TABLE public."ProjectServiceOverride" OWNER TO smmuser;

--
-- Name: PromoCode; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."PromoCode" (
    id text NOT NULL,
    code text NOT NULL,
    "discountPercent" integer NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "projectId" text
);


ALTER TABLE public."PromoCode" OWNER TO smmuser;

--
-- Name: Provider; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."Provider" (
    id text NOT NULL,
    name text NOT NULL,
    "apiKey" text NOT NULL,
    "apiUrl" text NOT NULL,
    "isEnabled" boolean DEFAULT true NOT NULL,
    "balanceThreshold" numeric(20,2) DEFAULT 1000.00 NOT NULL,
    metadata jsonb,
    "isDripFeedDisabled" boolean DEFAULT false NOT NULL,
    "pricesCurrency" public."Currency" DEFAULT 'USD'::public."Currency" NOT NULL,
    "projectId" text,
    "balanceCurrency" public."Currency" DEFAULT 'USD'::public."Currency" NOT NULL,
    type text DEFAULT 'universal'::text NOT NULL,
    "hasNativeDripFeed" boolean DEFAULT false NOT NULL,
    "syncLock" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Provider" OWNER TO smmuser;

--
-- Name: ProviderBalanceLog; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."ProviderBalanceLog" (
    id text NOT NULL,
    balance numeric(20,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "providerId" text NOT NULL,
    currency public."Currency" DEFAULT 'USD'::public."Currency" NOT NULL
);


ALTER TABLE public."ProviderBalanceLog" OWNER TO smmuser;

--
-- Name: ProviderLog; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."ProviderLog" (
    id integer NOT NULL,
    "serviceId" integer NOT NULL,
    "eventType" text NOT NULL,
    "oldValue" text,
    "newValue" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProviderLog" OWNER TO smmuser;

--
-- Name: ProviderLog_id_seq; Type: SEQUENCE; Schema: public; Owner: smmuser
--

CREATE SEQUENCE public."ProviderLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."ProviderLog_id_seq" OWNER TO smmuser;

--
-- Name: ProviderLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: smmuser
--

ALTER SEQUENCE public."ProviderLog_id_seq" OWNED BY public."ProviderLog".id;


--
-- Name: ProviderPayment; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."ProviderPayment" (
    id text NOT NULL,
    "providerId" text NOT NULL,
    amount numeric(20,2) NOT NULL,
    type public."ProviderPaymentType" NOT NULL,
    description text,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProviderPayment" OWNER TO smmuser;

--
-- Name: ProviderService; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."ProviderService" (
    id text NOT NULL,
    "externalId" text NOT NULL,
    name text NOT NULL,
    "rawPrice" numeric(20,4) NOT NULL,
    "rawData" jsonb NOT NULL,
    category public."Category" DEFAULT 'OTHER'::public."Category" NOT NULL,
    "isIgnored" boolean DEFAULT false NOT NULL,
    platform public."Platform" DEFAULT 'OTHER'::public."Platform" NOT NULL,
    "providerId" text NOT NULL,
    "socialPlatformId" text,
    description text,
    "rawCurrencyOriginal" public."Currency",
    "rawPriceOriginal" numeric(20,4),
    "dataHash" character varying(32) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastSeenAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProviderService" OWNER TO smmuser;

--
-- Name: ReferralLeaderboard; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."ReferralLeaderboard" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "projectId" text,
    month timestamp(3) without time zone NOT NULL,
    "referralCount" integer DEFAULT 0 NOT NULL,
    revenue numeric(10,2) DEFAULT 0 NOT NULL,
    rank integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ReferralLeaderboard" OWNER TO smmuser;

--
-- Name: Review; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."Review" (
    id text NOT NULL,
    "userId" text,
    "projectId" text NOT NULL,
    rating integer NOT NULL,
    text text,
    "isAnonymous" boolean DEFAULT false NOT NULL,
    status public."ReviewStatus" DEFAULT 'PENDING'::public."ReviewStatus" NOT NULL,
    "moderatedBy" text,
    "moderatedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "qualityScore" text DEFAULT 'MEDIUM'::text,
    "rewardAmount" numeric(10,2),
    "rewardClaimed" boolean DEFAULT false NOT NULL,
    "userName" text,
    "userRole" text,
    "avatarUrl" text,
    "orderId" integer
);


ALTER TABLE public."Review" OWNER TO smmuser;

--
-- Name: ScheduledOrder; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."ScheduledOrder" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "serviceId" text NOT NULL,
    "projectId" text,
    link text NOT NULL,
    quantity integer NOT NULL,
    "totalPrice" numeric(20,2),
    "costPrice" numeric(20,4),
    "scheduleTime" timestamp(3) without time zone NOT NULL,
    "repeatInterval" integer,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ScheduledOrder" OWNER TO smmuser;

--
-- Name: ServiceCategory; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."ServiceCategory" (
    id text NOT NULL,
    name text NOT NULL,
    slug text,
    description text,
    icon text,
    platform public."Platform" NOT NULL,
    "categoryType" public."Category" DEFAULT 'OTHER'::public."Category" NOT NULL,
    "targetType" text DEFAULT 'POST'::text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "projectId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "socialPlatformId" text,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."ServiceCategory" OWNER TO smmuser;

--
-- Name: ServiceChangeLog; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."ServiceChangeLog" (
    id text NOT NULL,
    "internalServiceId" text NOT NULL,
    type text NOT NULL,
    "oldValue" text,
    "newValue" text,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ServiceChangeLog" OWNER TO smmuser;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" bigint NOT NULL,
    data jsonb NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "projectId" text
);


ALTER TABLE public."Session" OWNER TO smmuser;

--
-- Name: Settings; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."Settings" (
    key text NOT NULL,
    value text NOT NULL,
    id text NOT NULL,
    "projectId" text
);


ALTER TABLE public."Settings" OWNER TO smmuser;

--
-- Name: SocialPlatform; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."SocialPlatform" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    "nameRu" text,
    keywords text[],
    icon text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SocialPlatform" OWNER TO smmuser;

--
-- Name: SupportMacro; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."SupportMacro" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    text text NOT NULL,
    actions jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SupportMacro" OWNER TO smmuser;

--
-- Name: SupportMessage; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."SupportMessage" (
    id text NOT NULL,
    "ticketId" text NOT NULL,
    sender public."MessageSender" NOT NULL,
    text text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "imageUrl" text,
    "voiceUrl" text,
    "staffUsername" text,
    "fileUrl" text,
    "videoUrl" text
);


ALTER TABLE public."SupportMessage" OWNER TO smmuser;

--
-- Name: SupportTemplate; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."SupportTemplate" (
    id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SupportTemplate" OWNER TO smmuser;

--
-- Name: SupportTicket; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."SupportTicket" (
    id text NOT NULL,
    "projectId" text,
    "userId" text NOT NULL,
    subject text NOT NULL,
    status public."TicketStatus" DEFAULT 'OPEN'::public."TicketStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "verifiedEmail" text,
    "verifiedUserId" text,
    "orderId" integer
);


ALTER TABLE public."SupportTicket" OWNER TO smmuser;

--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    "userId" text NOT NULL,
    amount numeric(20,2) NOT NULL,
    type public."TransactionType" NOT NULL,
    provider text NOT NULL,
    "externalId" text,
    status public."TransactionStatus" DEFAULT 'PENDING'::public."TransactionStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb,
    currency public."Currency" DEFAULT 'RUB'::public."Currency" NOT NULL,
    "projectId" text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "orderId" integer
);


ALTER TABLE public."Transaction" OWNER TO smmuser;

--
-- Name: User; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "tgId" bigint,
    username text,
    balance numeric(20,2) DEFAULT 0.00 NOT NULL,
    spent numeric(20,2) DEFAULT 0.00 NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "referralEarnings" numeric(20,2) DEFAULT 0.00 NOT NULL,
    "referrerId" text,
    "hasUsedFreeTest" boolean DEFAULT false NOT NULL,
    "allowedTabs" text[] DEFAULT ARRAY[]::text[],
    "banExpiresAt" timestamp(3) without time zone,
    currency public."Currency" DEFAULT 'RUB'::public."Currency" NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "earlyBirdRank" integer,
    email text,
    "isEarlyBird" boolean DEFAULT false NOT NULL,
    "isGlobalAdmin" boolean DEFAULT false NOT NULL,
    "isPermanentlyBanned" boolean DEFAULT false NOT NULL,
    "lastActionAt" timestamp(3) without time zone,
    "lastNotificationAt" timestamp(3) without time zone,
    "moderationNote" text,
    password text,
    "projectId" text,
    "reviewRewardUsed" boolean DEFAULT false NOT NULL,
    "supportNotes" text,
    "twoFactorCode" text,
    "twoFactorExpires" timestamp(3) without time zone,
    "warningCount" integer DEFAULT 0 NOT NULL,
    "apiKey" text,
    "referralCode" text NOT NULL,
    permissions text[] DEFAULT ARRAY[]::text[],
    "referralPercent" integer DEFAULT 0 NOT NULL,
    "resetPasswordCode" text,
    "resetPasswordExpires" timestamp(3) without time zone,
    "telegramContact" text,
    "twoFactorEnabled" boolean DEFAULT false NOT NULL,
    whatsapp text
);


ALTER TABLE public."User" OWNER TO smmuser;

--
-- Name: UserPromo; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."UserPromo" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "promoCodeId" text NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserPromo" OWNER TO smmuser;

--
-- Name: _StaffProjects; Type: TABLE; Schema: public; Owner: smmuser
--

CREATE TABLE public."_StaffProjects" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_StaffProjects" OWNER TO smmuser;

--
-- Name: InternalService numericId; Type: DEFAULT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."InternalService" ALTER COLUMN "numericId" SET DEFAULT nextval('public."InternalService_numericId_seq"'::regclass);


--
-- Name: Order id; Type: DEFAULT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Order" ALTER COLUMN id SET DEFAULT nextval('public."Order_id_seq"'::regclass);


--
-- Name: ProviderLog id; Type: DEFAULT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ProviderLog" ALTER COLUMN id SET DEFAULT nextval('public."ProviderLog_id_seq"'::regclass);


--
-- Data for Name: Achievement; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."Achievement" (id, "userId", type, "unlockedAt", claimed, "claimedAt") FROM stdin;
\.


--
-- Data for Name: AdminLog; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."AdminLog" (id, "adminId", action, "targetId", details, "createdAt") FROM stdin;
\.


--
-- Data for Name: AutoMonitoring; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."AutoMonitoring" (id, "projectId", "userId", "internalServiceId", link, quantity, "postsLimit", "postsProcessed", "lastPostId", "isActive", "createdAt", "updatedAt", "delayMinutes", "dripInterval", "dripRuns", "isDripFeed") FROM stdin;
\.


--
-- Data for Name: BatchOrder; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."BatchOrder" (id, "projectId", "userId", "totalAmount", "orderCount", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: BugReport; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."BugReport" (id, "userId", "projectId", title, description, severity, status, "screenshotUrl", "stepsToReproduce", "rewardAmount", "rewardPaid", "adminNotes", "reviewedBy", "reviewedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BusinessExpense; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."BusinessExpense" (id, "projectId", category, amount, description, date, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Challenge; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."Challenge" (id, "userId", type, progress, target, "expiresAt", completed, "completedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: ChurnPrediction; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."ChurnPrediction" (id, "createdAt", "predictedChurn", "confidenceScore", "recommendedAction", "notificationSent", "orderId") FROM stdin;
\.


--
-- Data for Name: ChurnSnapshot; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."ChurnSnapshot" (id, "snapshotDate", "subscriberCount", "daysElapsed", "dropoffRate", "orderId", metadata) FROM stdin;
\.


--
-- Data for Name: CurrencyRate; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."CurrencyRate" (code, rate, "updatedAt") FROM stdin;
\.


--
-- Data for Name: GlobalSetting; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."GlobalSetting" (id, key, value, "updatedAt") FROM stdin;
\.


--
-- Data for Name: InternalService; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."InternalService" (id, platform, category, name, description, geo, "pricePer1000", "minQty", "maxQty", "isActive", rating, "createdAt", "updatedAt", "priceUnit", "unitName", "avgCompletionTime", "lastProviderPrice", "statusCount", "successRate", "isPrivate", "targetType", "avgDropRate", "guaranteeDays", "isCurated", metadata, requirements, slug, "isDripFeedDisabled", "marketPrice", markup, "numericId", "providerCurrencyOriginal", "providerPriceOriginal", type, "categoryId", "socialPlatformId", "allowedTargetTypes") FROM stdin;
\.


--
-- Data for Name: InternalServiceMapping; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."InternalServiceMapping" (id, "internalServiceId", "providerServiceId", priority, reliability, "speedRating", "isActive", "providerId", "projectId") FROM stdin;
\.


--
-- Data for Name: LedgerEntry; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."LedgerEntry" (id, "projectId", "userId", amount, currency, "balanceBefore", "balanceAfter", type, "referenceId", description, "createdAt") FROM stdin;
\.


--
-- Data for Name: LegalDocument; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."LegalDocument" (id, "projectId", slug, title, content, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LoyaltyLog; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."LoyaltyLog" (id, "userId", "projectId", trigger, reward, value, "createdAt") FROM stdin;
\.


--
-- Data for Name: ManagedChannel; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."ManagedChannel" (id, "projectId", "userId", "chatId", username, title, "isActive", permissions, "serviceId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: NPSSurvey; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."NPSSurvey" (id, "userId", "projectId", score, comment, "createdAt", "orderId") FROM stdin;
\.


--
-- Data for Name: News; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."News" (id, title, content, "imageUrl", "isSent", "createdAt", "updatedAt", "projectId") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."Order" ("userId", "internalServiceId", "externalId", link, quantity, "totalPrice", status, remains, "createdAt", "updatedAt", "inviteLink", "discountAmount", "promoCodeId", "currentRun", "interval", "isDripFeed", "nextRunAt", runs, "providerRawResponse", "providerName", comments, "costPrice", "refundedAmount", "batchOrderId", "projectId", "currentCount", "initialCount", "lastCheckedAt", "warrantyDays", "managedChannelId", id, "parentId", "isManual", metadata) FROM stdin;
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."Project" (id, name, slug, domain, "botToken", "botUsername", config, "maintenanceMode", "createdAt", "updatedAt", "brandColor", "pricingRules", "safetySettings", "paymentSettings", "loyaltySettings", "isActive", "isDripFeedDisabled", "marketerSettings", markup, "serviceManagementMode") FROM stdin;
\.


--
-- Data for Name: ProjectServiceOverride; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."ProjectServiceOverride" (id, "projectId", "internalServiceId", "categoryId", "customPrice", "isActive", "customDescription", "customMaxQty", "customMinQty", "customName", "customRequirements", markup) FROM stdin;
\.


--
-- Data for Name: PromoCode; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."PromoCode" (id, code, "discountPercent", description, "isActive", "projectId") FROM stdin;
\.


--
-- Data for Name: Provider; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."Provider" (id, name, "apiKey", "apiUrl", "isEnabled", "balanceThreshold", metadata, "isDripFeedDisabled", "pricesCurrency", "projectId", "balanceCurrency", type, "hasNativeDripFeed", "syncLock") FROM stdin;
\.


--
-- Data for Name: ProviderBalanceLog; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."ProviderBalanceLog" (id, balance, "createdAt", "providerId", currency) FROM stdin;
\.


--
-- Data for Name: ProviderLog; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."ProviderLog" (id, "serviceId", "eventType", "oldValue", "newValue", "createdAt") FROM stdin;
\.


--
-- Data for Name: ProviderPayment; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."ProviderPayment" (id, "providerId", amount, type, description, "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProviderService; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."ProviderService" (id, "externalId", name, "rawPrice", "rawData", category, "isIgnored", platform, "providerId", "socialPlatformId", description, "rawCurrencyOriginal", "rawPriceOriginal", "dataHash", "isActive", "lastSeenAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ReferralLeaderboard; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."ReferralLeaderboard" (id, "userId", "projectId", month, "referralCount", revenue, rank, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."Review" (id, "userId", "projectId", rating, text, "isAnonymous", status, "moderatedBy", "moderatedAt", "createdAt", "updatedAt", "qualityScore", "rewardAmount", "rewardClaimed", "userName", "userRole", "avatarUrl", "orderId") FROM stdin;
\.


--
-- Data for Name: ScheduledOrder; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."ScheduledOrder" (id, "userId", "serviceId", "projectId", link, quantity, "totalPrice", "costPrice", "scheduleTime", "repeatInterval", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ServiceCategory; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."ServiceCategory" (id, name, slug, description, icon, platform, "categoryType", "targetType", priority, "projectId", "createdAt", "updatedAt", "socialPlatformId", "isActive") FROM stdin;
\.


--
-- Data for Name: ServiceChangeLog; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."ServiceChangeLog" (id, "internalServiceId", type, "oldValue", "newValue", reason, "createdAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."Session" (id, "userId", data, "updatedAt", "projectId") FROM stdin;
\.


--
-- Data for Name: Settings; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."Settings" (key, value, id, "projectId") FROM stdin;
\.


--
-- Data for Name: SocialPlatform; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."SocialPlatform" (id, slug, name, "nameRu", keywords, icon, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SupportMacro; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."SupportMacro" (id, title, description, text, actions, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SupportMessage; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."SupportMessage" (id, "ticketId", sender, text, "createdAt", "imageUrl", "voiceUrl", "staffUsername", "fileUrl", "videoUrl") FROM stdin;
\.


--
-- Data for Name: SupportTemplate; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."SupportTemplate" (id, title, content, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SupportTicket; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."SupportTicket" (id, "projectId", "userId", subject, status, "createdAt", "updatedAt", "isVerified", "verifiedEmail", "verifiedUserId", "orderId") FROM stdin;
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."Transaction" (id, "userId", amount, type, provider, "externalId", status, "createdAt", metadata, currency, "projectId", "updatedAt", "orderId") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."User" (id, "tgId", username, balance, spent, role, "createdAt", "updatedAt", "referralEarnings", "referrerId", "hasUsedFreeTest", "allowedTabs", "banExpiresAt", currency, "deletedAt", "earlyBirdRank", email, "isEarlyBird", "isGlobalAdmin", "isPermanentlyBanned", "lastActionAt", "lastNotificationAt", "moderationNote", password, "projectId", "reviewRewardUsed", "supportNotes", "twoFactorCode", "twoFactorExpires", "warningCount", "apiKey", "referralCode", permissions, "referralPercent", "resetPasswordCode", "resetPasswordExpires", "telegramContact", "twoFactorEnabled", whatsapp) FROM stdin;
\.


--
-- Data for Name: UserPromo; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."UserPromo" (id, "userId", "promoCodeId", "usedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: _StaffProjects; Type: TABLE DATA; Schema: public; Owner: smmuser
--

COPY public."_StaffProjects" ("A", "B") FROM stdin;
\.


--
-- Name: InternalService_numericId_seq; Type: SEQUENCE SET; Schema: public; Owner: smmuser
--

SELECT pg_catalog.setval('public."InternalService_numericId_seq"', 1, false);


--
-- Name: Order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: smmuser
--

SELECT pg_catalog.setval('public."Order_id_seq"', 1, false);


--
-- Name: ProviderLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: smmuser
--

SELECT pg_catalog.setval('public."ProviderLog_id_seq"', 1, false);


--
-- Name: Achievement Achievement_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Achievement"
    ADD CONSTRAINT "Achievement_pkey" PRIMARY KEY (id);


--
-- Name: AdminLog AdminLog_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."AdminLog"
    ADD CONSTRAINT "AdminLog_pkey" PRIMARY KEY (id);


--
-- Name: AutoMonitoring AutoMonitoring_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."AutoMonitoring"
    ADD CONSTRAINT "AutoMonitoring_pkey" PRIMARY KEY (id);


--
-- Name: BatchOrder BatchOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."BatchOrder"
    ADD CONSTRAINT "BatchOrder_pkey" PRIMARY KEY (id);


--
-- Name: BugReport BugReport_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."BugReport"
    ADD CONSTRAINT "BugReport_pkey" PRIMARY KEY (id);


--
-- Name: BusinessExpense BusinessExpense_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."BusinessExpense"
    ADD CONSTRAINT "BusinessExpense_pkey" PRIMARY KEY (id);


--
-- Name: Challenge Challenge_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Challenge"
    ADD CONSTRAINT "Challenge_pkey" PRIMARY KEY (id);


--
-- Name: ChurnPrediction ChurnPrediction_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ChurnPrediction"
    ADD CONSTRAINT "ChurnPrediction_pkey" PRIMARY KEY (id);


--
-- Name: ChurnSnapshot ChurnSnapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ChurnSnapshot"
    ADD CONSTRAINT "ChurnSnapshot_pkey" PRIMARY KEY (id);


--
-- Name: CurrencyRate CurrencyRate_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."CurrencyRate"
    ADD CONSTRAINT "CurrencyRate_pkey" PRIMARY KEY (code);


--
-- Name: GlobalSetting GlobalSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."GlobalSetting"
    ADD CONSTRAINT "GlobalSetting_pkey" PRIMARY KEY (id);


--
-- Name: InternalServiceMapping InternalServiceMapping_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."InternalServiceMapping"
    ADD CONSTRAINT "InternalServiceMapping_pkey" PRIMARY KEY (id);


--
-- Name: InternalService InternalService_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."InternalService"
    ADD CONSTRAINT "InternalService_pkey" PRIMARY KEY (id);


--
-- Name: LedgerEntry LedgerEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."LedgerEntry"
    ADD CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY (id);


--
-- Name: LegalDocument LegalDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."LegalDocument"
    ADD CONSTRAINT "LegalDocument_pkey" PRIMARY KEY (id);


--
-- Name: LoyaltyLog LoyaltyLog_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."LoyaltyLog"
    ADD CONSTRAINT "LoyaltyLog_pkey" PRIMARY KEY (id);


--
-- Name: ManagedChannel ManagedChannel_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ManagedChannel"
    ADD CONSTRAINT "ManagedChannel_pkey" PRIMARY KEY (id);


--
-- Name: NPSSurvey NPSSurvey_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."NPSSurvey"
    ADD CONSTRAINT "NPSSurvey_pkey" PRIMARY KEY (id);


--
-- Name: News News_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."News"
    ADD CONSTRAINT "News_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: ProjectServiceOverride ProjectServiceOverride_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ProjectServiceOverride"
    ADD CONSTRAINT "ProjectServiceOverride_pkey" PRIMARY KEY (id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: PromoCode PromoCode_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."PromoCode"
    ADD CONSTRAINT "PromoCode_pkey" PRIMARY KEY (id);


--
-- Name: ProviderBalanceLog ProviderBalanceLog_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ProviderBalanceLog"
    ADD CONSTRAINT "ProviderBalanceLog_pkey" PRIMARY KEY (id);


--
-- Name: ProviderLog ProviderLog_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ProviderLog"
    ADD CONSTRAINT "ProviderLog_pkey" PRIMARY KEY (id);


--
-- Name: ProviderPayment ProviderPayment_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ProviderPayment"
    ADD CONSTRAINT "ProviderPayment_pkey" PRIMARY KEY (id);


--
-- Name: ProviderService ProviderService_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ProviderService"
    ADD CONSTRAINT "ProviderService_pkey" PRIMARY KEY (id);


--
-- Name: Provider Provider_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Provider"
    ADD CONSTRAINT "Provider_pkey" PRIMARY KEY (id);


--
-- Name: ReferralLeaderboard ReferralLeaderboard_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ReferralLeaderboard"
    ADD CONSTRAINT "ReferralLeaderboard_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: ScheduledOrder ScheduledOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ScheduledOrder"
    ADD CONSTRAINT "ScheduledOrder_pkey" PRIMARY KEY (id);


--
-- Name: ServiceCategory ServiceCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ServiceCategory"
    ADD CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY (id);


--
-- Name: ServiceChangeLog ServiceChangeLog_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ServiceChangeLog"
    ADD CONSTRAINT "ServiceChangeLog_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Settings Settings_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Settings"
    ADD CONSTRAINT "Settings_pkey" PRIMARY KEY (id);


--
-- Name: SocialPlatform SocialPlatform_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."SocialPlatform"
    ADD CONSTRAINT "SocialPlatform_pkey" PRIMARY KEY (id);


--
-- Name: SupportMacro SupportMacro_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."SupportMacro"
    ADD CONSTRAINT "SupportMacro_pkey" PRIMARY KEY (id);


--
-- Name: SupportMessage SupportMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."SupportMessage"
    ADD CONSTRAINT "SupportMessage_pkey" PRIMARY KEY (id);


--
-- Name: SupportTemplate SupportTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."SupportTemplate"
    ADD CONSTRAINT "SupportTemplate_pkey" PRIMARY KEY (id);


--
-- Name: SupportTicket SupportTicket_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: UserPromo UserPromo_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."UserPromo"
    ADD CONSTRAINT "UserPromo_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _StaffProjects _StaffProjects_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."_StaffProjects"
    ADD CONSTRAINT "_StaffProjects_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: Achievement_type_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "Achievement_type_idx" ON public."Achievement" USING btree (type);


--
-- Name: Achievement_userId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "Achievement_userId_idx" ON public."Achievement" USING btree ("userId");


--
-- Name: Achievement_userId_type_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "Achievement_userId_type_key" ON public."Achievement" USING btree ("userId", type);


--
-- Name: AutoMonitoring_projectId_isActive_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "AutoMonitoring_projectId_isActive_idx" ON public."AutoMonitoring" USING btree ("projectId", "isActive");


--
-- Name: BugReport_projectId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "BugReport_projectId_idx" ON public."BugReport" USING btree ("projectId");


--
-- Name: BugReport_status_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "BugReport_status_idx" ON public."BugReport" USING btree (status);


--
-- Name: BusinessExpense_projectId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "BusinessExpense_projectId_idx" ON public."BusinessExpense" USING btree ("projectId");


--
-- Name: Challenge_expiresAt_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "Challenge_expiresAt_idx" ON public."Challenge" USING btree ("expiresAt");


--
-- Name: Challenge_userId_completed_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "Challenge_userId_completed_idx" ON public."Challenge" USING btree ("userId", completed);


--
-- Name: ChurnPrediction_orderId_createdAt_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "ChurnPrediction_orderId_createdAt_idx" ON public."ChurnPrediction" USING btree ("orderId", "createdAt");


--
-- Name: ChurnPrediction_recommendedAction_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "ChurnPrediction_recommendedAction_idx" ON public."ChurnPrediction" USING btree ("recommendedAction");


--
-- Name: ChurnSnapshot_orderId_snapshotDate_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "ChurnSnapshot_orderId_snapshotDate_idx" ON public."ChurnSnapshot" USING btree ("orderId", "snapshotDate");


--
-- Name: ChurnSnapshot_snapshotDate_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "ChurnSnapshot_snapshotDate_idx" ON public."ChurnSnapshot" USING btree ("snapshotDate");


--
-- Name: GlobalSetting_key_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "GlobalSetting_key_key" ON public."GlobalSetting" USING btree (key);


--
-- Name: InternalServiceMapping_projectId_internalServiceId_provider_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "InternalServiceMapping_projectId_internalServiceId_provider_key" ON public."InternalServiceMapping" USING btree ("projectId", "internalServiceId", "providerId");


--
-- Name: InternalService_numericId_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "InternalService_numericId_key" ON public."InternalService" USING btree ("numericId");


--
-- Name: InternalService_slug_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "InternalService_slug_key" ON public."InternalService" USING btree (slug);


--
-- Name: LedgerEntry_createdAt_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "LedgerEntry_createdAt_idx" ON public."LedgerEntry" USING btree ("createdAt");


--
-- Name: LedgerEntry_projectId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "LedgerEntry_projectId_idx" ON public."LedgerEntry" USING btree ("projectId");


--
-- Name: LedgerEntry_userId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "LedgerEntry_userId_idx" ON public."LedgerEntry" USING btree ("userId");


--
-- Name: LegalDocument_projectId_slug_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "LegalDocument_projectId_slug_key" ON public."LegalDocument" USING btree ("projectId", slug);


--
-- Name: LoyaltyLog_projectId_createdAt_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "LoyaltyLog_projectId_createdAt_idx" ON public."LoyaltyLog" USING btree ("projectId", "createdAt");


--
-- Name: LoyaltyLog_userId_trigger_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "LoyaltyLog_userId_trigger_key" ON public."LoyaltyLog" USING btree ("userId", trigger);


--
-- Name: ManagedChannel_chatId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "ManagedChannel_chatId_idx" ON public."ManagedChannel" USING btree ("chatId");


--
-- Name: ManagedChannel_chatId_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "ManagedChannel_chatId_key" ON public."ManagedChannel" USING btree ("chatId");


--
-- Name: ManagedChannel_projectId_chatId_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "ManagedChannel_projectId_chatId_key" ON public."ManagedChannel" USING btree ("projectId", "chatId");


--
-- Name: ManagedChannel_userId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "ManagedChannel_userId_idx" ON public."ManagedChannel" USING btree ("userId");


--
-- Name: NPSSurvey_createdAt_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "NPSSurvey_createdAt_idx" ON public."NPSSurvey" USING btree ("createdAt");


--
-- Name: NPSSurvey_projectId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "NPSSurvey_projectId_idx" ON public."NPSSurvey" USING btree ("projectId");


--
-- Name: NPSSurvey_score_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "NPSSurvey_score_idx" ON public."NPSSurvey" USING btree (score);


--
-- Name: NPSSurvey_userId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "NPSSurvey_userId_idx" ON public."NPSSurvey" USING btree ("userId");


--
-- Name: Order_externalId_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "Order_externalId_key" ON public."Order" USING btree ("externalId");


--
-- Name: ProjectServiceOverride_projectId_internalServiceId_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "ProjectServiceOverride_projectId_internalServiceId_key" ON public."ProjectServiceOverride" USING btree ("projectId", "internalServiceId");


--
-- Name: Project_botToken_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "Project_botToken_key" ON public."Project" USING btree ("botToken");


--
-- Name: Project_domain_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "Project_domain_key" ON public."Project" USING btree (domain);


--
-- Name: Project_slug_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "Project_slug_key" ON public."Project" USING btree (slug);


--
-- Name: PromoCode_projectId_code_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "PromoCode_projectId_code_key" ON public."PromoCode" USING btree ("projectId", code);


--
-- Name: ProviderService_dataHash_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "ProviderService_dataHash_idx" ON public."ProviderService" USING btree ("dataHash");


--
-- Name: ProviderService_providerId_externalId_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "ProviderService_providerId_externalId_key" ON public."ProviderService" USING btree ("providerId", "externalId");


--
-- Name: ProviderService_providerId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "ProviderService_providerId_idx" ON public."ProviderService" USING btree ("providerId");


--
-- Name: Provider_name_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "Provider_name_key" ON public."Provider" USING btree (name);


--
-- Name: Provider_projectId_name_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "Provider_projectId_name_key" ON public."Provider" USING btree ("projectId", name);


--
-- Name: ReferralLeaderboard_month_rank_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "ReferralLeaderboard_month_rank_idx" ON public."ReferralLeaderboard" USING btree (month, rank);


--
-- Name: ReferralLeaderboard_projectId_month_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "ReferralLeaderboard_projectId_month_idx" ON public."ReferralLeaderboard" USING btree ("projectId", month);


--
-- Name: ReferralLeaderboard_userId_month_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "ReferralLeaderboard_userId_month_key" ON public."ReferralLeaderboard" USING btree ("userId", month);


--
-- Name: Review_projectId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "Review_projectId_idx" ON public."Review" USING btree ("projectId");


--
-- Name: Review_qualityScore_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "Review_qualityScore_idx" ON public."Review" USING btree ("qualityScore");


--
-- Name: Review_rating_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "Review_rating_idx" ON public."Review" USING btree (rating);


--
-- Name: Review_status_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "Review_status_idx" ON public."Review" USING btree (status);


--
-- Name: Review_userId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "Review_userId_idx" ON public."Review" USING btree ("userId");


--
-- Name: ServiceCategory_projectId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "ServiceCategory_projectId_idx" ON public."ServiceCategory" USING btree ("projectId");


--
-- Name: ServiceCategory_projectId_platform_name_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "ServiceCategory_projectId_platform_name_key" ON public."ServiceCategory" USING btree ("projectId", platform, name);


--
-- Name: ServiceCategory_projectId_socialPlatformId_slug_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "ServiceCategory_projectId_socialPlatformId_slug_key" ON public."ServiceCategory" USING btree ("projectId", "socialPlatformId", slug);


--
-- Name: Session_projectId_userId_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "Session_projectId_userId_key" ON public."Session" USING btree ("projectId", "userId");


--
-- Name: Settings_projectId_key_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "Settings_projectId_key_key" ON public."Settings" USING btree ("projectId", key);


--
-- Name: SocialPlatform_slug_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "SocialPlatform_slug_key" ON public."SocialPlatform" USING btree (slug);


--
-- Name: SupportTicket_orderId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "SupportTicket_orderId_idx" ON public."SupportTicket" USING btree ("orderId");


--
-- Name: SupportTicket_verifiedEmail_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "SupportTicket_verifiedEmail_idx" ON public."SupportTicket" USING btree ("verifiedEmail");


--
-- Name: SupportTicket_verifiedUserId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "SupportTicket_verifiedUserId_idx" ON public."SupportTicket" USING btree ("verifiedUserId");


--
-- Name: Transaction_externalId_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "Transaction_externalId_key" ON public."Transaction" USING btree ("externalId");


--
-- Name: Transaction_projectId_idx; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "Transaction_projectId_idx" ON public."Transaction" USING btree ("projectId");


--
-- Name: UserPromo_userId_promoCodeId_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "UserPromo_userId_promoCodeId_key" ON public."UserPromo" USING btree ("userId", "promoCodeId");


--
-- Name: User_apiKey_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "User_apiKey_key" ON public."User" USING btree ("apiKey");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_projectId_earlyBirdRank_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "User_projectId_earlyBirdRank_key" ON public."User" USING btree ("projectId", "earlyBirdRank");


--
-- Name: User_referralCode_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "User_referralCode_key" ON public."User" USING btree ("referralCode");


--
-- Name: User_tgId_key; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE UNIQUE INDEX "User_tgId_key" ON public."User" USING btree ("tgId");


--
-- Name: _StaffProjects_B_index; Type: INDEX; Schema: public; Owner: smmuser
--

CREATE INDEX "_StaffProjects_B_index" ON public."_StaffProjects" USING btree ("B");


--
-- Name: Achievement Achievement_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Achievement"
    ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AutoMonitoring AutoMonitoring_internalServiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."AutoMonitoring"
    ADD CONSTRAINT "AutoMonitoring_internalServiceId_fkey" FOREIGN KEY ("internalServiceId") REFERENCES public."InternalService"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AutoMonitoring AutoMonitoring_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."AutoMonitoring"
    ADD CONSTRAINT "AutoMonitoring_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AutoMonitoring AutoMonitoring_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."AutoMonitoring"
    ADD CONSTRAINT "AutoMonitoring_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BatchOrder BatchOrder_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."BatchOrder"
    ADD CONSTRAINT "BatchOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BatchOrder BatchOrder_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."BatchOrder"
    ADD CONSTRAINT "BatchOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BugReport BugReport_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."BugReport"
    ADD CONSTRAINT "BugReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BugReport BugReport_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."BugReport"
    ADD CONSTRAINT "BugReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BusinessExpense BusinessExpense_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."BusinessExpense"
    ADD CONSTRAINT "BusinessExpense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Challenge Challenge_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Challenge"
    ADD CONSTRAINT "Challenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChurnPrediction ChurnPrediction_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ChurnPrediction"
    ADD CONSTRAINT "ChurnPrediction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChurnSnapshot ChurnSnapshot_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ChurnSnapshot"
    ADD CONSTRAINT "ChurnSnapshot_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InternalServiceMapping InternalServiceMapping_internalServiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."InternalServiceMapping"
    ADD CONSTRAINT "InternalServiceMapping_internalServiceId_fkey" FOREIGN KEY ("internalServiceId") REFERENCES public."InternalService"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InternalServiceMapping InternalServiceMapping_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."InternalServiceMapping"
    ADD CONSTRAINT "InternalServiceMapping_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InternalServiceMapping InternalServiceMapping_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."InternalServiceMapping"
    ADD CONSTRAINT "InternalServiceMapping_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public."Provider"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InternalServiceMapping InternalServiceMapping_providerServiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."InternalServiceMapping"
    ADD CONSTRAINT "InternalServiceMapping_providerServiceId_fkey" FOREIGN KEY ("providerServiceId") REFERENCES public."ProviderService"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InternalService InternalService_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."InternalService"
    ADD CONSTRAINT "InternalService_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."ServiceCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InternalService InternalService_socialPlatformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."InternalService"
    ADD CONSTRAINT "InternalService_socialPlatformId_fkey" FOREIGN KEY ("socialPlatformId") REFERENCES public."SocialPlatform"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LedgerEntry LedgerEntry_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."LedgerEntry"
    ADD CONSTRAINT "LedgerEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LedgerEntry LedgerEntry_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."LedgerEntry"
    ADD CONSTRAINT "LedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LegalDocument LegalDocument_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."LegalDocument"
    ADD CONSTRAINT "LegalDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LoyaltyLog LoyaltyLog_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."LoyaltyLog"
    ADD CONSTRAINT "LoyaltyLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LoyaltyLog LoyaltyLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."LoyaltyLog"
    ADD CONSTRAINT "LoyaltyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ManagedChannel ManagedChannel_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ManagedChannel"
    ADD CONSTRAINT "ManagedChannel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ManagedChannel ManagedChannel_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ManagedChannel"
    ADD CONSTRAINT "ManagedChannel_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public."InternalService"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ManagedChannel ManagedChannel_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ManagedChannel"
    ADD CONSTRAINT "ManagedChannel_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NPSSurvey NPSSurvey_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."NPSSurvey"
    ADD CONSTRAINT "NPSSurvey_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: NPSSurvey NPSSurvey_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."NPSSurvey"
    ADD CONSTRAINT "NPSSurvey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NPSSurvey NPSSurvey_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."NPSSurvey"
    ADD CONSTRAINT "NPSSurvey_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: News News_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."News"
    ADD CONSTRAINT "News_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_batchOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_batchOrderId_fkey" FOREIGN KEY ("batchOrderId") REFERENCES public."BatchOrder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_internalServiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_internalServiceId_fkey" FOREIGN KEY ("internalServiceId") REFERENCES public."InternalService"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_managedChannelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_managedChannelId_fkey" FOREIGN KEY ("managedChannelId") REFERENCES public."ManagedChannel"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_promoCodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES public."PromoCode"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProjectServiceOverride ProjectServiceOverride_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ProjectServiceOverride"
    ADD CONSTRAINT "ProjectServiceOverride_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."ServiceCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProjectServiceOverride ProjectServiceOverride_internalServiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ProjectServiceOverride"
    ADD CONSTRAINT "ProjectServiceOverride_internalServiceId_fkey" FOREIGN KEY ("internalServiceId") REFERENCES public."InternalService"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProjectServiceOverride ProjectServiceOverride_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ProjectServiceOverride"
    ADD CONSTRAINT "ProjectServiceOverride_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PromoCode PromoCode_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."PromoCode"
    ADD CONSTRAINT "PromoCode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProviderBalanceLog ProviderBalanceLog_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ProviderBalanceLog"
    ADD CONSTRAINT "ProviderBalanceLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public."Provider"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProviderPayment ProviderPayment_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ProviderPayment"
    ADD CONSTRAINT "ProviderPayment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public."Provider"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProviderService ProviderService_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ProviderService"
    ADD CONSTRAINT "ProviderService_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public."Provider"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProviderService ProviderService_socialPlatformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ProviderService"
    ADD CONSTRAINT "ProviderService_socialPlatformId_fkey" FOREIGN KEY ("socialPlatformId") REFERENCES public."SocialPlatform"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Provider Provider_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Provider"
    ADD CONSTRAINT "Provider_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReferralLeaderboard ReferralLeaderboard_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ReferralLeaderboard"
    ADD CONSTRAINT "ReferralLeaderboard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReferralLeaderboard ReferralLeaderboard_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ReferralLeaderboard"
    ADD CONSTRAINT "ReferralLeaderboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Review Review_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Review Review_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Review Review_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ScheduledOrder ScheduledOrder_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ScheduledOrder"
    ADD CONSTRAINT "ScheduledOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ScheduledOrder ScheduledOrder_serviceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ScheduledOrder"
    ADD CONSTRAINT "ScheduledOrder_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES public."InternalService"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ScheduledOrder ScheduledOrder_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ScheduledOrder"
    ADD CONSTRAINT "ScheduledOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ServiceCategory ServiceCategory_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ServiceCategory"
    ADD CONSTRAINT "ServiceCategory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ServiceCategory ServiceCategory_socialPlatformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ServiceCategory"
    ADD CONSTRAINT "ServiceCategory_socialPlatformId_fkey" FOREIGN KEY ("socialPlatformId") REFERENCES public."SocialPlatform"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ServiceChangeLog ServiceChangeLog_internalServiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."ServiceChangeLog"
    ADD CONSTRAINT "ServiceChangeLog_internalServiceId_fkey" FOREIGN KEY ("internalServiceId") REFERENCES public."InternalService"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SupportMessage SupportMessage_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."SupportMessage"
    ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."SupportTicket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupportTicket SupportTicket_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SupportTicket SupportTicket_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SupportTicket SupportTicket_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SupportTicket SupportTicket_verifiedUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."SupportTicket"
    ADD CONSTRAINT "SupportTicket_verifiedUserId_fkey" FOREIGN KEY ("verifiedUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserPromo UserPromo_promoCodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."UserPromo"
    ADD CONSTRAINT "UserPromo_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES public."PromoCode"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserPromo UserPromo_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."UserPromo"
    ADD CONSTRAINT "UserPromo_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_referrerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: _StaffProjects _StaffProjects_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."_StaffProjects"
    ADD CONSTRAINT "_StaffProjects_A_fkey" FOREIGN KEY ("A") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _StaffProjects _StaffProjects_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: smmuser
--

ALTER TABLE ONLY public."_StaffProjects"
    ADD CONSTRAINT "_StaffProjects_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict slt2WlozopPF67rRwcXXVsPATEt9mSlALF4OMWRDeyhYXuApSfO700DNrpJiTzh


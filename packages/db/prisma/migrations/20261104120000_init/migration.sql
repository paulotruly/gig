-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(15) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `absolute_expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessions_token_hash_key`(`token_hash`),
    INDEX `sessions_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `type` ENUM('BANK', 'ACCOUNTING', 'ACCELERATOR', 'INCUBATOR', 'PLATFORM', 'COMMUNITY', 'INVESTOR') NOT NULL,
    `join_code` VARCHAR(32) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `partners_join_code_key`(`join_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partner_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partner_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,

    INDEX `partner_members_user_id_idx`(`user_id`),
    UNIQUE INDEX `partner_members_partner_id_user_id_key`(`partner_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `businesses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `type` ENUM('MEI', 'ME', 'STARTUP', 'SERVICE_PROVIDER') NOT NULL,
    `partner_id` INTEGER NULL,
    `cash_balance` DECIMAL(14, 2) NULL,
    `cash_balance_date` DATE NULL,
    `forecast_dirty_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `businesses_partner_id_idx`(`partner_id`),
    INDEX `businesses_forecast_dirty_at_idx`(`forecast_dirty_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `business_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `role` ENUM('OWNER', 'ACCOUNTANT') NOT NULL,

    INDEX `business_members_user_id_idx`(`user_id`),
    UNIQUE INDEX `business_members_business_id_user_id_key`(`business_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `consent_ref` CHAR(36) NOT NULL,
    `purpose` ENUM('ASSISTED_INGESTION', 'OPEN_FINANCE', 'WHATSAPP_NOTIFICATIONS', 'PARTNER_AGGREGATES') NOT NULL,
    `scope` VARCHAR(191) NOT NULL,
    `status` ENUM('GRANTED', 'REVOKED') NOT NULL,
    `granted_at` DATETIME(3) NOT NULL,
    `expires_at` DATETIME(3) NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_by_user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `consents_business_id_purpose_idx`(`business_id`, `purpose`),
    INDEX `consents_consent_ref_idx`(`consent_ref`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `institution` VARCHAR(120) NOT NULL,
    `type` VARCHAR(40) NOT NULL,
    `external_ref` VARCHAR(191) NOT NULL,
    `access_token_encrypted` TEXT NULL,
    `last_synced_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `accounts_business_id_external_ref_key`(`business_id`, `external_ref`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statement_imports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `format` VARCHAR(8) NOT NULL,
    `file_hash` CHAR(64) NOT NULL,
    `rows_total` INTEGER NOT NULL,
    `rows_imported` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `statement_imports_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `account_id` INTEGER NULL,
    `import_id` INTEGER NULL,
    `date` DATE NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `category` VARCHAR(40) NOT NULL,
    `label` ENUM('PERSONAL', 'BUSINESS', 'TAX', 'SUPPLIER', 'WITHDRAWAL') NOT NULL,
    `label_source` ENUM('RULE', 'LEARNED', 'USER') NOT NULL,
    `user_corrected` BOOLEAN NOT NULL DEFAULT false,
    `dedup_key` CHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `transactions_business_id_date_idx`(`business_id`, `date`),
    UNIQUE INDEX `transactions_business_id_dedup_key_key`(`business_id`, `dedup_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classification_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `pattern` VARCHAR(191) NOT NULL,
    `label` ENUM('PERSONAL', 'BUSINESS', 'TAX', 'SUPPLIER', 'WITHDRAWAL') NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `classification_rules_business_id_pattern_key`(`business_id`, `pattern`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commitments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `type` ENUM('FIXED_EXPENSE', 'RECEIVABLE') NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `due_date` DATE NOT NULL,
    `recurrence` ENUM('NONE', 'MONTHLY') NOT NULL DEFAULT 'NONE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `commitments_business_id_idx`(`business_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forecasts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `as_of` DATE NOT NULL,
    `horizon_weeks` INTEGER NOT NULL,
    `safe_withdrawal` DECIMAL(14, 2) NOT NULL,
    `explanation` JSON NOT NULL,
    `rules_version` VARCHAR(20) NOT NULL,
    `input_hash` CHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `forecasts_business_id_id_idx`(`business_id`, `id`),
    UNIQUE INDEX `forecasts_business_id_rules_version_input_hash_key`(`business_id`, `rules_version`, `input_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forecast_scenarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `forecast_id` INTEGER NOT NULL,
    `scenario` ENUM('CONSERVATIVE', 'LIKELY', 'FAVORABLE') NOT NULL,
    `end_balance` DECIMAL(14, 2) NOT NULL,
    `first_negative_date` DATE NULL,
    `runway_months` DECIMAL(10, 1) NULL,
    `runway_status` ENUM('FINITE', 'NOT_BURNING') NOT NULL,
    `monthly_revenue` DECIMAL(14, 2) NOT NULL,
    `monthly_expense` DECIMAL(14, 2) NOT NULL,

    INDEX `forecast_scenarios_business_id_idx`(`business_id`),
    UNIQUE INDEX `forecast_scenarios_forecast_id_scenario_key`(`forecast_id`, `scenario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alerts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `rule_id` VARCHAR(40) NOT NULL,
    `reference_date` DATE NOT NULL,
    `message` VARCHAR(500) NOT NULL,
    `explanation` VARCHAR(255) NOT NULL,
    `data` JSON NOT NULL,
    `track_slug` VARCHAR(60) NOT NULL,
    `rules_version` VARCHAR(20) NOT NULL,
    `channel` ENUM('APP', 'WHATSAPP') NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'SKIPPED', 'FAILED') NOT NULL,
    `sent_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `alerts_status_channel_idx`(`status`, `channel`),
    UNIQUE INDEX `alerts_business_id_rule_id_reference_date_key`(`business_id`, `rule_id`, `reference_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tracks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(60) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `summary` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `tracks_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `track_progress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `track_id` INTEGER NOT NULL,
    `percent` INTEGER NOT NULL,
    `completed_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `track_progress_business_id_track_id_key`(`business_id`, `track_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partner_metrics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `partner_id` INTEGER NOT NULL,
    `period` CHAR(7) NOT NULL,
    `indicator` VARCHAR(60) NOT NULL,
    `value` DECIMAL(14, 2) NOT NULL,
    `business_count` INTEGER NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `partner_metrics_partner_id_period_indicator_key`(`partner_id`, `period`, `indicator`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actor_user_id` INTEGER NULL,
    `business_id` INTEGER NULL,
    `action` VARCHAR(60) NOT NULL,
    `target_type` VARCHAR(40) NULL,
    `target_id` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_log_business_id_created_at_idx`(`business_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usage_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `business_id` INTEGER NOT NULL,
    `event` ENUM('CONSENT_GRANTED', 'FIRST_FORECAST_VIEWED', 'WEEKLY_OPEN', 'TRACK_COMPLETED') NOT NULL,
    `dedupe_key` VARCHAR(80) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usage_events_business_id_dedupe_key_key`(`business_id`, `dedupe_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `external_id` VARCHAR(191) NOT NULL,
    `business_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `whatsapp_messages_external_id_key`(`external_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_members` ADD CONSTRAINT `partner_members_partner_id_fkey` FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_members` ADD CONSTRAINT `partner_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `businesses` ADD CONSTRAINT `businesses_partner_id_fkey` FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `business_members` ADD CONSTRAINT `business_members_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `business_members` ADD CONSTRAINT `business_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consents` ADD CONSTRAINT `consents_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `statement_imports` ADD CONSTRAINT `statement_imports_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_import_id_fkey` FOREIGN KEY (`import_id`) REFERENCES `statement_imports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classification_rules` ADD CONSTRAINT `classification_rules_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commitments` ADD CONSTRAINT `commitments_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forecasts` ADD CONSTRAINT `forecasts_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forecast_scenarios` ADD CONSTRAINT `forecast_scenarios_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `forecast_scenarios` ADD CONSTRAINT `forecast_scenarios_forecast_id_fkey` FOREIGN KEY (`forecast_id`) REFERENCES `forecasts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `track_progress` ADD CONSTRAINT `track_progress_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `track_progress` ADD CONSTRAINT `track_progress_track_id_fkey` FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_metrics` ADD CONSTRAINT `partner_metrics_partner_id_fkey` FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usage_events` ADD CONSTRAINT `usage_events_business_id_fkey` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- Histórico imutável (regras 5 e 9): UPDATE e DELETE são recusados pelo próprio banco.
-- O BEGIN e o END mantêm os gatilhos restauráveis a partir do mysqldump.
CREATE TRIGGER consents_no_update BEFORE UPDATE ON `consents` FOR EACH ROW
  BEGIN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'consents é só de inserção'; END;
CREATE TRIGGER consents_no_delete BEFORE DELETE ON `consents` FOR EACH ROW
  BEGIN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'consents é só de inserção'; END;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON `audit_log` FOR EACH ROW
  BEGIN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'audit_log é só de inserção'; END;
CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON `audit_log` FOR EACH ROW
  BEGIN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'audit_log é só de inserção'; END;

-- Trilhas com título e resumo provisórios, até haver conteúdo real (P-16).
INSERT INTO `tracks` (`slug`, `title`, `summary`) VALUES
  ('fluxo-de-caixa', 'Fluxo de caixa', 'Como antecipar meses fracos e organizar os próximos vencimentos.'),
  ('separar-contas', 'Separar contas pessoais e do negócio', 'Como separar aos poucos, no ritmo do negócio.'),
  ('impostos-e-das', 'Impostos e DAS', 'Como provisionar impostos antes do vencimento.'),
  ('runway', 'Runway para startups', 'Como calcular e estender o tempo de caixa.');

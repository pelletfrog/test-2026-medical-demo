-- 病患，欄位見 docs/data-model.md §2.2；共用欄位見 §2
CREATE TABLE patients (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    medical_record_no varchar(20) NOT NULL,
    name              varchar(50) NOT NULL,
    created_at        timestamptz NOT NULL,
    updated_at        timestamptz NOT NULL,
    created_by        bigint REFERENCES users (id),
    updated_by        bigint REFERENCES users (id),
    deleted_at        timestamptz,
    -- 不加 WHERE deleted_at IS NULL：已刪除的病患也占用病歷號，避免被重複使用
    CONSTRAINT uk_patients_medical_record_no UNIQUE (medical_record_no),
    -- 繞過 API 寫入時也不會出現小寫：大小寫不同的病歷號會被當成兩個，唯一約束就擋不住
    CONSTRAINT ck_patients_medical_record_no CHECK (medical_record_no ~ '^[A-Z0-9]+$')
);

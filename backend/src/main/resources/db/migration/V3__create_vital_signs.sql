-- 生命徵象，欄位見 docs/data-model.md §2.3；共用欄位見 §2
-- 數值只限制格式與位數，不限制醫學上的合理範圍，理由見生命徵象 spec §5
CREATE TABLE vital_signs (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id         bigint      NOT NULL REFERENCES patients (id),
    measured_at        timestamptz NOT NULL,
    -- 不指定小數位數：指定的話 36.85 會被自動四捨五入存進去，檢查約束就擋不到
    body_temperature   numeric     NOT NULL,
    heart_rate         integer     NOT NULL,
    respiratory_rate   integer     NOT NULL,
    systolic_pressure  integer     NOT NULL,
    diastolic_pressure integer     NOT NULL,
    oxygen_saturation  integer     NOT NULL,
    created_at         timestamptz NOT NULL,
    updated_at         timestamptz NOT NULL,
    created_by         bigint REFERENCES users (id),
    updated_by         bigint REFERENCES users (id),
    deleted_at         timestamptz,
    -- 不加 WHERE deleted_at IS NULL：已刪除的紀錄也占用這個時間；
    -- patient_id 排在第一欄，依病患查詢時也用得到這個索引，不另外替外鍵建索引
    CONSTRAINT uk_vital_signs_patient_id_measured_at UNIQUE (patient_id, measured_at),
    CONSTRAINT ck_vital_signs_measured_at CHECK (measured_at = date_trunc('minute', measured_at)),
    CONSTRAINT ck_vital_signs_body_temperature
        CHECK (body_temperature BETWEEN 0 AND 999.9 AND body_temperature = round(body_temperature, 1)),
    CONSTRAINT ck_vital_signs_heart_rate CHECK (heart_rate BETWEEN 0 AND 999),
    CONSTRAINT ck_vital_signs_respiratory_rate CHECK (respiratory_rate BETWEEN 0 AND 999),
    CONSTRAINT ck_vital_signs_systolic_pressure CHECK (systolic_pressure BETWEEN 0 AND 999),
    CONSTRAINT ck_vital_signs_diastolic_pressure CHECK (diastolic_pressure BETWEEN 0 AND 999),
    CONSTRAINT ck_vital_signs_oxygen_saturation CHECK (oxygen_saturation BETWEEN 0 AND 999)
);

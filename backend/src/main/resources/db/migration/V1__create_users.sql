-- 使用者，欄位見 docs/data-model.md §2.1；共用欄位見 §2
CREATE TABLE users (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username      varchar(50) NOT NULL,
    password_hash text        NOT NULL,
    name          text        NOT NULL,
    created_at    timestamptz NOT NULL,
    updated_at    timestamptz NOT NULL,
    created_by    bigint REFERENCES users (id),
    updated_by    bigint REFERENCES users (id),
    deleted_at    timestamptz,
    -- 不加 WHERE deleted_at IS NULL：已刪除的帳號也占用帳號名稱，避免被重複使用
    CONSTRAINT uk_users_username UNIQUE (username)
);

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"  # 정의되지 않은 환경 변수 무시
    )

    SECRET_KEY: str = "dev-secret-key-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # DB settings (Loaded from env if available)
    DB_HOST: str = "db"
    DB_PORT: str = "3306"
    DB_USER: str = "sool"
    DB_PASSWORD: str = "soolpass"
    DB_NAME: str = "sool"

settings = Settings()

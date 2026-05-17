from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"  # 정의되지 않은 환경 변수 무시
    )

    SECRET_KEY: str = "dev-secret-key-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3300"
    CORS_ORIGINS: str = "http://localhost:3300,http://localhost:3000"
    SESSION_COOKIE_SECURE: bool = False

    # DB settings (Loaded from env if available)
    DB_HOST: str = "db"
    DB_PORT: str = "3306"
    DB_USER: str = "sool"
    DB_PASSWORD: str = "soolpass"
    DB_NAME: str = "sool"

    # Social Login (OAuth2)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    KAKAO_CLIENT_ID: str = ""
    KAKAO_CLIENT_SECRET: str = "" # Optional
    SESSION_SECRET_KEY: str = "session-secret-key-change-this"

settings = Settings()

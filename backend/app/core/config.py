import json
import urllib.parse
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Self Assistant API"
    API_V1_STR: str = "/api/v1"
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5974
    POSTGRES_USER: str = "app_user"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = "assistant_db"
    DATABASE_URL: str | None = None

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5274",
        "http://127.0.0.1:5274",
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            url_str = self.DATABASE_URL.strip()
            # Handle postgres:// or postgresql:// prefix for asyncpg
            if url_str.startswith("postgres://"):
                url_str = url_str.replace("postgres://", "postgresql+asyncpg://", 1)
            elif url_str.startswith("postgresql://"):
                url_str = url_str.replace("postgresql://", "postgresql+asyncpg://", 1)

            parsed = urllib.parse.urlsplit(url_str)
            query_params = urllib.parse.parse_qs(parsed.query)

            # Clean query parameters: remove libpq-specific unsupported options like channel_binding, sslmode
            unsupported = {"channel_binding", "sslmode", "gssencmode", "target_session_attrs"}
            has_ssl = False
            if "sslmode" in query_params:
                if any(val in ["require", "verify-ca", "verify-full"] for val in query_params["sslmode"]):
                    has_ssl = True
            if "ssl" in query_params:
                has_ssl = True

            cleaned_params = {}
            for k, v in query_params.items():
                if k.lower() not in unsupported and k.lower() != "ssl":
                    cleaned_params[k] = v[0]

            if has_ssl:
                cleaned_params["ssl"] = "require"

            new_query = urllib.parse.urlencode(cleaned_params)
            return urllib.parse.urlunsplit(
                (parsed.scheme, parsed.netloc, parsed.path, new_query, parsed.fragment)
            )

        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

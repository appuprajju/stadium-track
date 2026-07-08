import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "StadiumMind AI Operations"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql://postgres:password@localhost:5432/stadiummind",
        validation_alias="DATABASE_URL"
    )
    
    # Cache
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    # Event Broker
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    
    # AI Engine API Keys
    GEMINI_API_KEY: str = Field(default="", validation_alias="GEMINI_API_KEY")
    OPENAI_API_KEY: str = Field(default="", validation_alias="OPENAI_API_KEY")
    
    # Environment
    ENV: str = "development"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

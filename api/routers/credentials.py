from dependencies.auth_deps import CurrentUser
from dependencies.credentials_deps import CredentialsServiceDep
from fastapi import APIRouter
from models.credential import CredentialCreate, CredentialPublic, CredentialUpdate

router = APIRouter()


@router.get("/group/{group}", response_model=list[CredentialPublic])
async def get_credentials_by_group(
    group: str, credentials_service: CredentialsServiceDep, user: CurrentUser
):
    return credentials_service.get_credential_by_group(group, user)


@router.get("/{id}", response_model=CredentialPublic)
async def get_credentials_by_id(
    id: int, credentials_service: CredentialsServiceDep, user: CurrentUser
):
    return credentials_service.get_credential_by_id(id, user)


@router.get("/", response_model=list[CredentialPublic])
async def get_my_credentials(
    credentials_service: CredentialsServiceDep, user: CurrentUser
):
    return credentials_service.get_my_credentials(user)


@router.post("/", response_model=CredentialPublic)
async def add_credential(
    credential: CredentialCreate,
    credentials_service: CredentialsServiceDep,
    current_user: CurrentUser,
):
    return credentials_service.add_credential(credential, current_user)


@router.put("/group/{group}", response_model=CredentialPublic)
async def update_credential_group(
    group: str,
    credential: CredentialUpdate,
    credentials_service: CredentialsServiceDep,
    current_user: CurrentUser,
):
    return credentials_service.update_credential_group(group, credential, current_user)


@router.put("/batch", response_model=list[CredentialPublic])
async def update_credential_batch(
    credentials: list[CredentialUpdate],
    credentials_service: CredentialsServiceDep,
    current_user: CurrentUser,
):
    return credentials_service.update_private_credentials_batch(
        credentials, current_user
    )


@router.put("/{id}", response_model=CredentialPublic)
async def update_credential_one(
    id: int,
    credential: CredentialUpdate,
    credentials_service: CredentialsServiceDep,
    current_user: CurrentUser,
):
    return credentials_service.update_credential_one(id, credential, current_user)


@router.delete("/group/{group}")
async def delete_credential_group(
    group: str,
    credentials_service: CredentialsServiceDep,
    current_user: CurrentUser,
):
    return credentials_service.delete_credential_group(group, current_user)


@router.delete("/{id}")
async def delete_credential_one(
    id: int,
    credentials_service: CredentialsServiceDep,
    current_user: CurrentUser,
):
    return credentials_service.delete_credential_one(id, current_user)

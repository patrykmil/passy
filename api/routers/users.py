from dependencies.auth_deps import CurrentUser
from dependencies.users_deps import UsersServiceDep
from fastapi import APIRouter
from models.user import ChangeKeysRequest, ChangePasswordRequest, UserCreate, UserPublic

router = APIRouter()


@router.get("/me", response_model=UserPublic)
async def get_me(current_user: CurrentUser, users_service: UsersServiceDep):
    return users_service.get_current_user_info(current_user)


@router.get("/{id}", response_model=UserPublic)
async def get_users_by_id(id: int, users_service: UsersServiceDep):
    return users_service.get_user_by_id(id)


@router.get("/", response_model=list[UserPublic])
async def get_all_users(users_service: UsersServiceDep):
    return users_service.get_all_users()


@router.post("/", response_model=UserPublic)
async def add_user(user: UserCreate, users_service: UsersServiceDep):
    return users_service.create_user(user)


@router.put("/me/password")
async def change_password(
    change_password_request: ChangePasswordRequest,
    current_user: CurrentUser,
    users_service: UsersServiceDep,
):
    return users_service.change_user_password(
        current_user,
        change_password_request.old_password,
        change_password_request.new_password,
        change_password_request.encrypted_private_key,
    )


@router.put("/me/keys")
async def change_keys(
    change_keys_request: ChangeKeysRequest,
    current_user: CurrentUser,
    users_service: UsersServiceDep,
):
    return users_service.change_user_keys(
        current_user,
        change_keys_request.public_key,
        change_keys_request.encrypted_private_key,
    )

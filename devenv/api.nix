{ pkgs, ... }:

{
  languages.python = {
    enable = true;
    package = pkgs.python313;
  };

  packages = with pkgs.python313Packages; [
    fastapi
    fastapi-cli
    uvicorn
    sqlmodel
    pyjwt
    python-multipart
    argon2-cffi
  ];
}

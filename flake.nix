{
  description = "Password manager";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        initDb = pkgs.writeShellScriptBin "init-db" ''
          #!/usr/bin/env bash
          exec "${toString ./.}/database/init_db.sh" "$@"
        '';
        run = pkgs.writeShellScriptBin "passy" ''
          #!/usr/bin/env bash
          exec "${toString ./.}/run.sh" "$@"
        '';

        basePackages = with pkgs; [
          python313
          bun
          sqlite
          ruff
          prettier
          texliveFull
          tex-fmt
        ];

        pythonModules = with pkgs.python313Packages; [
          fastapi
          fastapi-cli
          uvicorn
          sqlmodel
          pyjwt
          python-multipart
          argon2-cffi
        ];

        scripts = [
          initDb
          run
        ];

      in
      {
        devShells.default = pkgs.mkShell {
          packages = basePackages ++ pythonModules ++ scripts;

          shellHook = ''
            if [ ! -d ./webapp/node_modules ]; then
              echo "webapp/node_modules not found - running 'bun install'"
              if command -v bun >/dev/null 2>&1; then
                (cd ./webapp && bun install) || echo "bun install failed"
              else
                echo "bun not available in PATH"
              fi
            fi

            if [ ! -f ./database/database.db ]; then
              echo "database/database.db not found - running 'init-db'..."
              if command -v init-db >/dev/null 2>&1; then
                init-db || echo "init-db failed"
              else
                echo "init-db not found in PATH."
              fi
            fi
          '';
        };
      }
    );
}

{ pkgs, config, ... }:

{
  imports = [
    ./devenv/api.nix
    ./devenv/webapp.nix
  ];

  packages = [
    pkgs.sqlite
    pkgs.ruff
    pkgs.prettier
  ];

  scripts = {
    init-db.exec = ''
      exec "${config.git.root}/database/init_db.sh" "$@"
    '';

    passy.exec = ''
      exec "${config.git.root}/run.sh" "$@"
    '';
  };

  enterShell = ''
    if [ ! -f "${config.git.root}/database/database.db" ]; then
      echo "database/database.db not found - running 'init-db'..."
      init-db || echo "init-db failed"
    fi
  '';

  processes = {
    api = {
      exec = "fastapi dev";
      cwd = "${config.git.root}/api";
    };

    webapp = {
      exec = "pnpm dev";
      cwd = "${config.git.root}/webapp";
    };
  };

  git-hooks = {
    enable = false;
    hooks = {
      ruff.enable = true;
      ruff-format.enable = true;
      prettier.enable = true;
    };
  };
}

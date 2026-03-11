# 🛠️ Инструкция по запуску собственной инфраструктуры GitLab

Эта инструкция поможет запустить **GitLab CE** и **GitLab Runner** на вашем Ubuntu сервере. 

> [!IMPORTANT]
> GitLab потребляет много памяти. Мы настроили его в режиме оптимизации, но убедитесь, что на сервере включен **Swap** (см. `DEPLOY_2.md`).

---

## 🚀 1. Запуск GitLab

1. Скопируйте файл `docker-compose.gitlab.yml` на сервер в папку `/opt/gitlab-server`.
2. Запустите его:
   ```bash
   cd /opt/gitlab-server
   docker compose -f docker-compose.gitlab.yml up -d
   ```
3. Подождите **5-10 минут**. GitLab — тяжелое приложение, ему нужно время, чтобы инициализировать базу данных.

---

## 🔑 2. Получение пароля администратора

После того как контейнеры запустятся, вам нужно узнать временный пароль для пользователя `root`:

```bash
docker exec -it gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

---

## 🔗 3. Вход в панель

1. Откройте в браузере: `http://ваш-ip:8080`
2. Логин: `root`
3. Пароль: тот, который вы получили на предыдущем шаге.
4. **Сразу смените пароль** в настройках профиля.

---

## 🏃 4. Регистрация GitLab Runner

Runner (Бегун) — это процесс, который будет собирать ваши Docker-образы Smmplan.

1. Зайдите в GitLab: **Admin Area -> CI/CD -> Runners**.
2. Нажмите **New instance runner**.
3. Настройте тег (например, `docker-build`) и получите **Registration Token**.
4. В консоли сервера выполните команду регистрации:
   ```bash
   docker exec -it gitlab-runner gitlab-runner register \
     --non-interactive \
     --url "http://gitlab:8080/" \
     --registration-token "ВАШ_ТОКЕН" \
     --executor "docker" \
     --docker-image docker:latest \
     --description "Smmplan Builder" \
     --docker-privileged \
     --docker-volumes "/var/run/docker.sock:/var/run/docker.sock"
   ```

---

## 🛳️ 5. Соединение с проектом Smmplan

Теперь в вашем проекте Smmplan (где лежит код):
1. Настройте `git remote add origin http://ваш-ip:8080/root/smmplan.git`.
2. Запушьте код: `git push -u origin main`.
3. Файл `.gitlab-ci.yml` (из `COLLABORATION_GUIDE.md`) автоматически запустит сборку.

---

**Теперь ваша команда работает в полностью автоматической и защищенной среде!**

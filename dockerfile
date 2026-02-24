FROM  env/ubuntu-node-pwsh:v1

# Install PowerShell


WORKDIR /app
# mkdir output

RUN mkdir -p /app/output


COPY . .

ENTRYPOINT ["pwsh", "./crawl_agentId.ps1"]

FROM mysql:8.0

RUN microdnf install -y openssl gzip

COPY infra/backup/backup.sh infra/backup/restore.sh infra/backup/agendar.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restore.sh /usr/local/bin/agendar.sh

ENTRYPOINT ["/usr/local/bin/agendar.sh"]

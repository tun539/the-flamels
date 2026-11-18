FROM node:22-bookworm AS node
FROM python:3.12-bookworm
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx
WORKDIR /app
COPY scripts/research_platform.py scripts/research_platform.py
COPY research-platform research-platform
RUN python scripts/research_platform.py setup
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
HEALTHCHECK --interval=30s --start-period=90s CMD python scripts/research_platform.py status
CMD ["python", "scripts/research_platform.py", "start", "--host", "0.0.0.0"]

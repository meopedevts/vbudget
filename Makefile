FRONT_DIR    := frontend
BACK_DIR     := backend
EMBEDDED_DIR := $(BACK_DIR)/src/embedded

.PHONY: all frontend backend run clean docker-build

all: frontend backend

## Build the Solid+Vite frontend and copy the bundle into the embedded directory
frontend:
	cd $(FRONT_DIR) && pnpm build
	rm -rf $(EMBEDDED_DIR)/assets $(EMBEDDED_DIR)/index.html
	cp -r $(FRONT_DIR)/dist/. $(EMBEDDED_DIR)/

## Compile the V backend (embeds the frontend bundle into the binary)
backend:
	cd $(BACK_DIR) && v src/ -o bin/vbudget

## Build everything and start the server
run:
	$(MAKE) frontend
	$(MAKE) backend
	$(BACK_DIR)/bin/vbudget

## Build the production Docker image
docker-build:
	docker build -t vbudget .

## Remove all generated artifacts
clean:
	rm -rf $(FRONT_DIR)/dist
	rm -rf $(EMBEDDED_DIR)/assets $(EMBEDDED_DIR)/index.html
	rm -f $(BACK_DIR)/bin/vbudget

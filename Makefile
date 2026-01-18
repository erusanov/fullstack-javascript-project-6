install:
	npm ci

publish:
	npm publish --dry-run

lint:
	npx eslint .

start:
	npm run start

dev:
	npm run dev

lintfix:
	npx eslint --fix .

test:
	npm test

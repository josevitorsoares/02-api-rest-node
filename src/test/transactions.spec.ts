import { it, beforeAll, afterAll, describe, expect, beforeEach } from "vitest";
import { execSync } from "child_process";
import request from "supertest";
import { app } from "../app";

describe("Transactions Routes", () => {
    beforeAll(async () => {
        await app.ready();
    });
    
    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        execSync("npm run knex migrate:rollback --all");
        execSync("npm run knex migrate:latest");
    });

    it("shold be able create a new transaction", async () => {
        await request(app.server)
            .post("/transactions")
            .send({
                title: "New Transaction",
                type: "credit",
                amount: 10000
            })
            .expect(201);
    });

    it("shold be able to list all transactions", async () => {
        const createTransactionResponse = await request(app.server)
            .post("/transactions")
            .send({
                title: "New Transactions",
                type: "credit",
                amount: 10000
            });

        const cookie = createTransactionResponse.get("Set-Cookie");

        const listTransactionsResponse = await request(app.server)
            .get("/transactions")
            .set("Cookie", cookie)
            .expect(200);
        
        expect(listTransactionsResponse.body.transactions).toEqual([
            expect.objectContaining({
                title: "New Transactions",
                amount: 10000
            })
        ]);
    });

    it("shold be able to get a specific transaction", async () => {
        const createTransactionResponse = await request(app.server)
            .post("/transactions")
            .send({
                title: "New Transaction",
                type: "credit",
                amount: 10000
            });
        
        const cookie = createTransactionResponse.get("Set-Cookie");

        const listTransactionsResponse = await request(app.server)
            .get("/transactions")
            .set("Cookie", cookie)
            .expect(200);

        const transacitonId = listTransactionsResponse.body.transactions[0].id;

        const getTransactionResponse = await request(app.server)
            .get(`/transactions/${transacitonId}`)
            .set("Cookie", cookie)
            .expect(200);

        expect(getTransactionResponse.body.transaction).toEqual(
            expect.objectContaining({
                title: "New Transaction",
                amount: 10000
            })
        );

        it("shold be able to get summary of transactions", async () => {
            const createTransactionResponse = await request(app.server)
                .post("/transactions")
                .send({
                    title: "New Transactions",
                    type: "credit",
                    amount: 10000
                });
            
            const cookie = createTransactionResponse.get("Set-Cookie");

            await request(app.server)
                .post("/transactions")
                .set("Cookie", cookie)
                .send({
                    title: "Debit Transaction",
                    type: "debit",
                    amount: 2000
                });

            const summaryResponse = await request(app.server)
                .get("/transactions/summary")
                .set("Cookie", cookie);

            expect(summaryResponse.body.summary).toEqual(
                expect.objectContaining({
                    amount: 8000
                })
            );
        });
    });
});
import { DependencyContainer } from "tsyringe";

import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { IDatabaseTables } from "@spt-aki/models/spt/server/IDatabaseTables";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { HandbookHelper } from "@spt-aki/helpers/HandbookHelper";
import { PaymentHelper } from "@spt-aki/helpers/PaymentHelper";
import { LogTextColor } from "@spt-aki/models/spt/logging/LogTextColor";

class Mod implements IPostDBLoadMod {
    public postDBLoad(container: DependencyContainer): void {
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const logger = container.resolve<ILogger>("WinstonLogger");
        const handbookHelper = container.resolve<HandbookHelper>("HandbookHelper");
        const paymentHelper = container.resolve<PaymentHelper>("PaymentHelper");
        const bitcoinId = "59faff1d86f7746c51718c9c";

        const tables: IDatabaseTables = databaseServer.getTables();

        const bitcoinHandbook = tables.templates.handbook.Items.find((x) => x.Id === bitcoinId);

        fetch("https://api.blockchain.com/v3/exchange/tickers/BTC-USD")
            .then((res) => res.json())
            .then((data) => {
                const rawPrice = parseInt(data.price_24h) * 0.2;
                const price =
                    handbookHelper.inRUB(
                        parseInt(rawPrice.toString()),
                        paymentHelper.getCurrency("USD")
                    ) ?? bitcoinHandbook.Price;
                bitcoinHandbook.Price = price;
                // transform the price into a string and add a comma to separate thousands
                const priceString = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                logger.logWithColor(
                    `[Real Bitcoin Price] Changed bitcoin price to ${priceString} RUB.`,
                    LogTextColor.GREEN
                );
            });
    }
}

module.exports = { mod: new Mod() };

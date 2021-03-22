/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.
  *
  * Created by chris on 07/09/2016.
  *
  */
package io.venuu.vuu.core.module.simul

import io.venuu.toolbox.lifecycle.{DefaultLifecycleEnabled, LifecycleContainer}
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.api._
import io.venuu.vuu.core.module.simul.provider._
import io.venuu.vuu.core.module.{ModuleFactory, ViewServerModule}
import io.venuu.vuu.core.table.Columns
import io.venuu.vuu.net.RequestContext
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.provider.RpcProvider
import io.venuu.vuu.provider.simulation.{SimulatedBigInstrumentsProvider, SimulatedPricesProvider}

trait SimulRpcHandler{
  def onSendToMarket(param1: Map[String , Any])(ctx: RequestContext): Boolean

}

class TheSimulRpcHander extends DefaultLifecycleEnabled with RpcHandler with SimulRpcHandler{
  def onSendToMarket(param1: Map[String , Any])(ctx: RequestContext): Boolean = {
    println("onSendToMarket called:" + param1)
    false
  }
}

object SimulationModule {

  final val NAME = "SIMUL"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer): ViewServerModule = {
    implicit val randomNumbers = new SeededRandomNumbers(clock.now())

    val ordersModel = new ParentChildOrdersModel()

    ModuleFactory.withNamespace(NAME)
      .addTable(
          TableDef(
            name = "instruments",
            keyField = "ric",
            columns = Columns.fromNames("ric:String", "description:String", "currency: String", "exchange:String", "lotSize:Int"),
            VisualLinks(),
            joinFields = "ric"
          ),
          (table, vs) => new SimulatedBigInstrumentsProvider(table)
      )
      .addTable(
        AutoSubscribeTableDef(
          name = "prices",
          keyField = "ric",
          Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double", "scenario: String", "phase:String"),
          joinFields = "ric"
        ),
        (table, vs) => new SimulatedPricesProvider(table, maxSleep = 800)
      )
      .addTable(
        TableDef(
          name = "orders",
          keyField = "orderId",
          Columns.fromNames("orderId:String", "side:Char", "ric:String", "ccy:String", "quantity:Double", "trader:String", "filledQuantity:Double", "lastUpdate: Long", "created: Long"),
          VisualLinks(
            Link("ric", "instruments", "ric"),
            Link("ric", "prices", "ric")
          ),
          joinFields = "orderId", "ric"
        ),
        (table, vs) => new OrdersSimulProvider(table)
      )
      .addTable(
        TableDef(
          name = "parentOrders",
          keyField = "id",
          Columns.fromNames("id:String", "idAsInt: Int", "ric:String", "childCount: Int", "price:Double", "quantity:Int", "side:String", "account:String", "exchange: String",
                                    "ccy: String", "algo: String", "volLimit:Double", "filledQty:Int", "openQty:Int", "averagePrice: Double", "status:String",
                                    "lastUpdate:Long"),
          VisualLinks(
            Link("ric", "prices", "ric")
          ),
          indices = Indices(
            Index("ric")
          ),
          joinFields = "id", "ric"
        ),
        (table, vs) => new ParentOrdersProvider(table, ordersModel)
      )
      .addTable(
        TableDef(
          name = "childOrders",
          keyField = "id",
          Columns.fromNames("parentOrderId:Int", "id:String", "idAsInt: Int", "ric:String", "price:Double", "quantity:Int", "side:String", "account:String", "exchange: String",
            "ccy: String", "strategy: String", "volLimit:Double", "filledQty:Int", "openQty:Int", "averagePrice: Double", "status:String", "lastUpdate:Long"),
          VisualLinks(
            Link("parentOrderId", "parentOrders", "idAsInt")
          ),
          indices = Indices(
            Index("parentOrderId"),
            Index("quantity"),
            Index("exchange"),
            Index("ccy"),
          ),
          joinFields = "id", "ric"
        ),
        (table, vs) => new ChildOrdersProvider(table, ordersModel)
      )
      .addTable(
        TableDef(
          name = "orderEntry",
          keyField = "clOrderId",
          Columns.fromNames("clOrderId:String", "ric:String", "quantity: Double", "orderType:String", "price: Double", "priceLevel: String"),
          VisualLinks(
            Link("ric", "instruments", "ric")
          ),
          joinFields =  "ric"
        ),
        (table, vs) => new RpcProvider(table)
      )
      .addJoinTable(tableDefs =>
        JoinTableDef(
            name = "instrumentPrices",
            baseTable = tableDefs.get("instruments"),
            joinColumns = Columns.allFrom(tableDefs.get("instruments")) ++ Columns.allFromExcept(tableDefs.get("prices"), "ric"),
            joins =
              JoinTo(
                table = tableDefs.get("prices"),
                joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
              ),
            joinFields = Seq()
      ))
      .addJoinTable(tableDefs =>
        JoinTableDef(
          name = "ordersPrices",
          baseTable = tableDefs.get("orders"),
          joinColumns = Columns.allFrom(tableDefs.get("orders")) ++ Columns.allFromExcept(tableDefs.get("prices"), "ric"),
          joins =
            JoinTo(
              table = tableDefs.get("prices"),
              joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
            ),
          joinFields = Seq()
        ))
      .addRpcHandler(vs => new TheSimulRpcHander)
      .asModule()
  }
}

package io.venuu.vuu.util

object MapUtils {

  def expectMap(actual: Map[String, Any])(block: => Map[String, Any] ): Unit = {
    val map = block

  }
}

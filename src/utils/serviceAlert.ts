import axios from 'axios';

// 简化版服务故障警报系统
export class ServiceAlert {
  // 可配置企业微信、钉钉、Slack等得webhook地址
  private static readonly WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL || '';
  
  /**
   * 发送API故障警报
   * @param serviceName 服务名称
   * @param network 网络类型
   * @param address 钱包地址
   * @param error 错误信息
   */
  public static logApiFailure(serviceName: string, network: string, address: string, error: any): void {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // 构建警报消息
    const alertMessage = {
      title: `API故障警报: ${serviceName}`,
      text: `服务: ${serviceName}\n网络: ${network}\n地址: ${address}\n错误: ${errorMessage}\n时间: ${new Date().toLocaleString()}`,
    };
    
    // 在控制台输出错误信息
    console.error(`[${timestamp}] API故障: ${serviceName} (${network}) - ${errorMessage}`);
    
    /* 
    // 通过webhook发送警报
    if (ServiceAlert.WEBHOOK_URL) {
      try {
        axios.post(ServiceAlert.WEBHOOK_URL, alertMessage)
          .then(() => console.log(`成功发送警报到webhook: ${serviceName}-${network}`))
          .catch(err => console.error(`发送webhook警报失败:`, err));
      } catch (err) {
        console.error(`准备发送webhook警报时出错:`, err);
      }
    }
    */
    
    // 使用console打印错误（替代webhook发送）
    console.warn(`\n===== 服务警报 =====\n${alertMessage.title}\n${alertMessage.text}\n===================\n`);
  }
  
  // 记录一般信息
  
  public static log(message: string): void {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

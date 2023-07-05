import { PROXIES } from '../system/persist'
import { writeFileSync } from 'fs'
import chalk from 'chalk'

export async function makeFirewallScript() {
  const rules = PROXIES
    .map(p => p.split('@')[1].split(':'))
    .map(([ ip, port ]) => [ ip, port ]).reduce((acc, [ ip, port ]) => {
      return (
        acc +
        `iptables -A INPUT  -s ${ip} -p tcp -m tcp --sport ${port} -j ACCEPT\n` +
        `iptables -A OUTPUT -d ${ip} -p tcp -m tcp --dport ${port} -j ACCEPT\n`
      )
    }, '')

  writeFileSync(`setup-firewall.sh`, getFile(rules))

  console.log(
    `\nСоздан файл setup-firewall.sh\n` +
    `Для запуска выполните команду\n` +
    chalk.bold('chmod +x ./setup-firewall.sh && ./setup-firewall.sh')
  )

  process.exit()
}

const getFile = (proxyRules: string) => `#!/bin/sh

echo "Удаляем созданные правила"
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X

echo "Блокируем все соединения, кроме явно разрешенных"
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

echo "Разрешаем локальные соединения"
iptables -A INPUT  -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

echo "Разрешаем ssh соединения"
iptables -A INPUT   -p tcp -m tcp --dport 22 -j ACCEPT
iptables -A OUTPUT  -p tcp -m tcp --sport 22 -m state --state ESTABLISHED -j ACCEPT

echo "Разрешаем DNS соединения"
iptables -A INPUT   -p tcp -m tcp --sport 53 -j ACCEPT
iptables -A OUTPUT  -p tcp -m tcp --dport 53 -j ACCEPT
iptables -A FORWARD -p tcp -m tcp --dport 53 -j ACCEPT
iptables -A INPUT   -p udp -m udp --sport 53 -j ACCEPT
iptables -A OUTPUT  -p udp -m udp --dport 53 -j ACCEPT
iptables -A FORWARD -p udp -m udp --dport 53 -j ACCEPT

echo "Разрешаем соединения с galxe"
iptables -A OUTPUT  -p tcp -d "graphigo.prd.galaxy.eco" --dport 443 -j ACCEPT
iptables -A INPUT   -p tcp -s "graphigo.prd.galaxy.eco" --sport 443 -j ACCEPT

echo "Разрешаем соединения с RPC"
iptables -A OUTPUT  -p tcp -d "bsc-dataseed.binance.org" --dport 443 -j ACCEPT
iptables -A INPUT   -p tcp -s "bsc-dataseed.binance.org" --sport 443 -j ACCEPT

echo "Разрешаем соединения с прокси"
${proxyRules}
`

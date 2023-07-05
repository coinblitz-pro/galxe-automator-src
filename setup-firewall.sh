#!/bin/sh

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
iptables -A INPUT  -s 145.249.252.21 -p tcp -m tcp --sport 40502 -j ACCEPT
iptables -A OUTPUT -d 145.249.252.21 -p tcp -m tcp --dport 40502 -j ACCEPT


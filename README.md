# Overview

Pyrometer is a tool for monitoring events on
[Tezos](https://tezos.com/) networks.

Supports Seoul (023) and Tallinn (024) protocols with Octez v24+.

## Design/Architechture

- [Monitoring](./doc/monitoring.md)

## Run on Ubuntu/Debian

- Install NodeJS 16 or later following instructions at
  <https://github.com/nodesource/distributions>.

- Download latest .deb from the Releases page.

- Install:

```shell
sudo dpkg -i pyrometer_0.8.0_all.deb
```

- If Pyrometer is installed on a machine where Tezos baker is [set up
  with tezos-packaging](https://github.com/serokell/tezos-packaging/blob/master/docs/baking.md)
  then status UI will be automatically enabled and available at
  <http://localhost:2020>, configured to monitor local node and baker.
  Otherwise edit config file `/etc/pyrometer.toml`
  to specify bakers and nodes to monitor, for example:

```shell
sudo nano /etc/pyrometer.toml
```

- If desired, edit config file `/etc/pyrometer.toml` to configure notification
  channels

- If config file was edited - restart pyrometer service:

```shell
sudo systemctl restart pyrometer
```

- Check log output, e.g.:

```shell
journalctl -u pyrometer -f
```

## Configuration (TOML)

```toml

exclude = [
  "baked",
  "endorsed",
]

[baker_monitor]
bakers = ["tz3RDC3Jdn4j15J7bBHZd29EUee9gVB1CxD9",
"tz3bvNMQ95vfAYtG8193ymshqjSvmxiCUuR5"]

## use special "wildcard" baker address to monitor all active bakers:
# bakers = ["*"]

max_catchup_blocks = 120
rpc = "https://mainnet.api.tez.ie/"

[log]
level = "debug"

[email]
enabled = true
host = "mailhog"
port = 1025
username = "aaa"
password = "bbb"
to = [ "me@example.org" ]
emoji = true
short_address = true

```

> All options can also be passed via CLI. Run `pyrometer run --help` for details.

### TzKT (optional)

Enable displaying the baker's Octez version via the TzKT API.

```toml
[tzkt]
enabled = false
# base_url = "https://api.tzkt.io"
```

CLI equivalents: `--tzkt:enabled=true` and `--tzkt:base_url=https://api.tzkt.io`.

Note: if disabled, no TzKT requests are made.

### Status UI

Pyrometer provides node and baker status web user interface. It is
automatically enabled if local `baker` address alias found in local
`tezos-client` configuration (as would be the case when Pyrometer is
running on the same machine as baker [set up with
tezos-packaging](https://github.com/serokell/tezos-packaging/blob/master/docs/baking.md)),
otherwise it is disabled by default.

To enable, add or edit `ui` section in the config file:

```toml
[ui]
enabled = true
# port = 2020
# host = "0.0.0.0"
# explorer_url = "https://hangzhou.tzstats.com"
explorer_url = "https://tzstats.com"
show_system_info = true
```

By default the status UI is served on port `2020` at `localhost`. Set `host = "0.0.0.0"` to access it from another machine.

[![Pyrometer UI screenshot](doc/pyrometer-0.2.0-ui-thumb.jpg)](doc/pyrometer-0.2.0-ui.png)

When local baker setup is detected Pyrometer UI also
displays system resources and process information. This can also be
explicitely enabled (or disabled) by setting `show_system_info` to
`true`.

If detecting the local baker setup is not desired, it can be turned off in config:

```toml
[autodetect]
enabled = false
```

---

Note: Docker and npm registry instructions are intentionally omitted for now. `.deb` packages and Releases are the recommended distribution.

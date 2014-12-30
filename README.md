Dyart Labs POS distribution configuration.
==========================================

Required/Optional Packages:
---------------------------
xorg-dev and libX11-dev are required to compile utilities.

node npm and nodewebkit in global space or chromium-browser with chromium-codecs-ffmpeg-extra

Xorg -> Display Server

LightDM -> Display Manager

Ratpoison -> Window Manager

ifplugd -> Ethernet checker

1) Move xsessions to /usr/share/xsessions to add session a xsession to ligthDM login list.

2) Move ligthdm conf.

3) .ratpoisonrc is provided with the project. Move it to the home directly of the default POS user.

Install Plymouth Theme:
-----------------------
sudo apt-get install plymouth-theme-ubuntu-logo
sudo apt-get install plymouth-theme-text

Replace text in text.playmouth

cp --recursive themes/dyartlabs-logo /lib/plymouth/themes

sudo ln -sf /lib/plymouth/themes/dyartlabs-logo/dyartlabs-logo.plymouth /etc/alternatives/default.plymouth

sudo ln -sf /lib/plymouth/themes/dyartlabs-logo/dyartlabs-logo.grub /etc/alternatives/default.plymouth.grub

sudo update-initramfs -u

sudo update-grub

Add user to 'dialout' group for triggering register.
sudo adduser user dialout
Deployment Todo:
----------------
Test screen count dependency

Create Base Pos User

Remove TTY1-6 and Disable keys CLTR+ALT+FN1-12 based on user

Deploy nodewebkit project as an ecrypted .nw accessible via certificate signed by Dyart labs

Nodewebkit Icons and branding: https://github.com/rogerwang/node-webkit/wiki/Icons

VirtualBox Notes:
-----------------
Packages Recommended: virtualbox-guest-x11

X11 Icons and Cursors:
----------------------
**User wide install:** Copy themes/icons to ~/.icons

**System wide install:** Copy themes/icons to /usr/share/icons/

Create a symbolic link named "default" pointed to the icon themes directory either in ~/.icons or /usr/share/icons

More details: https://wiki.archlinux.org/index.php/Cursor_Themes

GTK Theme:
----------
**User wide install:** Copy themes/gtk-themes to ~/.themes

**System wide install:** Copy themes/gtk-themes to /usr/share/themes

Use gtk-chtheme package to change theme

More details: http://fluxbox-wiki.org/index.php?title=Using_gtk_themes

Print Requirements
-------------------
Install Node Cupsidity with libcups2-dev package.
Install Wkhtmltopdf with node package.

Harware:
--------
*LCD For Employee

*LCD For Customer

*Backpanel 7-bit BCD LCD for Customer Total

USB Pin Pad and Card Reader for Customer

Thermal Reciept Printer / Regular Printer (GGW will use regular printer)

USB Register

1 x Credit Card Swipers for Employee Screen (Mini USB 3TK)

USB Barcode Scanner

Internet Based Payment

Future Hardware:
----------------
Pin Pad Replacement with Cheap China Tablet / Signature input and PIN entry

Table Attached Barcode Scanner

Allow Physical Verifone Terminals to conntect via RS232 as Payment Methods

Issues and System Limitations:
------------------------------
Multiple successive refreshes crash 'nw' if native context menus are used. Refreshing will be disabled for this application, so refreshing issue isn't that big. Does happen on node <= v0.10.24 and nodewebkit <= 0.8.4

Debugged Use Cases:
-------------------
.Xauthority is set to root permission, maybe because of startx command being run, at that point desktop cannot log in. Need to further test and contain issue.

Current Install Script:
-----------------------

#!/usr/bin/env bash
sudo apt-get update
sudo apt-get -y dist-upgrade
sudo apt-get -y install git zsh

curl -L http://install.ohmyz.sh | sh

sudo chsh -s /bin/zsh ggw
HOME=/home/posuser
sudo useradd posuser
passwd posuser
sudo mkdir /home/posuser
sudo chown posuser:posuser /home/posuser
sudo -u posuser cp -rf /home/ggw/.oh-my-zsh /home/posuser
sudo -u posuser cp -rf /home/ggw/.zshrc /home/posuser
sudo chsh -s /bin/zsh posuser

su posuser
cd ~
git clone https://asadpakistani@bitbucket.org/asadpakistani/ggw-pos-standalone.git
cd ggw-pos-standalone
git checkout ProductionBuild
cp .ratpoisonrc ../
exit

sudo apt-get -y install lightdm ratpoison x11-xserver-utils

sudo cp -rf /home/posuser/ggw-pos-standalone/conf/lightdm.conf /etc/lightdm/lightdm.conf

sudo mkdir /usr/share/xsessions
sudo cp /home/posuser/ggw-pos-standalone/xsessions/ratpoison.desktop /usr/share/xsessions/

sudo add-apt-repository -y ppa:chris-lea/node.js
sudo apt-get -y update
sudo apt-get -y install python-software-properties python g++ make nodejs monitc
sudo npm -g install nodewebkit@0.8.6-3

sudo apt-get -y install plymouth-theme-ubuntu-logo
sudo cp --recursive /home/posuser/ggw-pos-standalone/themes/dyartlabs-logo /lib/plymouth/themes

sudo cp -rf /home/posuser/ggw-pos-standalone/conf/grub /etc/default/grub

sudo ln -sf /lib/plymouth/themes/dyartlabs-logo/dyartlabs-logo.plymouth /etc/alternatives/default.plymouth
sudo ln -sf /lib/plymouth/themes/dyartlabs-logo/dyartlabs-logo.grub /etc/alternatives/default.plymouth.grub

sudo mv /etc/update-motd.d /etc/update-motd.d-old
sudo cp -r /home/posuser/ggw-pos-standalone/conf/update-motd.d /etc
sudo cp -rf /home/posuser/ggw-pos-standalone/conf/startup/node_print_server /etc/monit/conf.d
sudo cp -rf /home/posuser/ggw-pos-standalone/conf/startup/node-printer.conf /etc/init

#Replace text in text.plymount  # sudo vi /lib/plymouth/themes/text.plymouth

sudo update-initramfs -u
sudo update-grub

#Ubuntu 14.04 upgraded to udev1 from udev0 so symlink is needed for nodewebkit.
cd /lib/*-linux-gnu
sudo ln -s libudev.so.1 libudev.so.0
sudo reboot

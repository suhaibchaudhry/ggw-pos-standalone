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
git checkout master
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
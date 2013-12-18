Dyart Labs POS distribution configuration.
==========================================

Required/Optional Packages:
---------------------------
node npm and nodewebkit in global space
Xorg -> Display Server
LightDM -> Display Manager
Ratpoison -> Window Manager
ifplugd -> Ethernet checker

1) Move xsessions to /usr/share/xsessions to add session a xsession to ligthDM login list.

2) Move ligthdm conf.

3) .ratpoisonrc is provided with the project. Move it to the home directly of the default POS user.

Install Plymouth Theme:
-----------------------
Replace text in text.playmouth

cp --recursive themes/dyartlabs-logo /lib/plymouth/themes
sudo ln -sf /lib/plymouth/themes/dyartlabs-logo/dyartlabs-logo.plymouth /etc/alternatives/default.plymouth
sudo ln -sf /lib/plymouth/themes/dyartlabs-logo/dyartlabs-logo.grub /etc/alternatives/default.plymouth.grub

sudo update-initramfs -u
sudo update-grub

Todo:
-----

Add screen count dependency to ratpoisonrc
Create Base Pos User
Remove TTY1-6 and Disable keys CLTR+ALT+FN1-12 based on user

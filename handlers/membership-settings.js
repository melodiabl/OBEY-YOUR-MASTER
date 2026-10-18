function membershipDefaults(root) {
  const defaults = { ...(root === 'leave' ? { channel: 'nochannel', msg: '{user} left this Server' } : { roles: [], captcha: false, secondchannel: 'nochannel', secondmsg: ':wave: {user} **Welcome to our Server!** :v:' }),
    image: true, custom: 'no', background: 'transparent', frame: true, framecolor: 'white', pb: true, invite: true, discriminator: true, membercount: true, servername: true,
    dm: root === 'leave', imagedm: root === 'leave', customdm: 'no', backgrounddm: 'transparent', framedm: true, framecolordm: 'white', pbdm: true, invitedm: true, discriminatordm: true, membercountdm: true, servernamedm: true,
    dm_msg: root === 'leave' ? '{user} left this Server' : '{user} Welcome to this Server' }
  return defaults
}

module.exports = { membershipDefaults }
